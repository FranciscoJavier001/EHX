import { validMarket } from '../engine/market'
import { missions } from '../content/catalog'
import { createWorld, nodeId, PROCESS_IDS, SECRET_IDS, type World, type WorldEvent } from '../engine/world'
import { commandNames } from '../engine/commands'

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const integer = (v: unknown, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= max
const list = (v: unknown, length: number, test: (entry: unknown) => boolean): v is unknown[] => Array.isArray(v) && v.length <= length && v.every(test)
const string = (value: unknown, size: number) => typeof value === 'string' && value.length <= size
const nodes = Array.from({ length: 200 }, (_, index) => nodeId(index))
const member = (options: string[]) => (value: unknown) => typeof value === 'string' && options.includes(value)
const node = member(nodes)
const time = (v: unknown): v is number => integer(v, 8.64e15)
function validEvent(e: unknown): e is WorldEvent {
  return object(e) && typeof e.id === 'string' && /^EVENT-\d{3,16}$/.test(e.id) && time(e.timestamp) &&
    string(e.type, 100) && member(['info', 'warning', 'critical'])(e.severity) && node(e.sourceEntityId) &&
    list(e.relatedEntityIds, 8, node) && string(e.description, 240) && member(['observed', 'open', 'resolved'])(e.status) &&
    list(e.consequences, 8, entry => string(entry, 160)) && object(e.metadata) && string(e.metadata.channel, 100) && string(e.metadata.message, 240)
}
export function parseSave(raw: unknown): World {
  if (!object(raw)) throw new Error('Expected a save object.')
  const w = raw.version === 1 ? { ...raw, version: 2, suspended: [], sessions: [], favorites: ['status', 'nodes', 'signals'] } : raw
  if (w.version !== 2 || !integer(w.seed, 0xffffffff) || !time(w.createdAt) || !time(w.savedAt) ||
      !integer(w.sequence, 1e12) || typeof w.started !== 'boolean' ||
      !list(w.devices, 200, item => object(item) && node(item.id) && member(['online', 'degraded', 'isolated'])(item.state)) ||
      w.devices.length !== 200 || !list(w.events, 145, validEvent) ||
      !list(w.seen, 1000, id => typeof id === 'string' && /^(NODE|ARCHIVE|REPORT|EVENT|KEY|OMEGA|SIGNAL|MISSION|SAT)-\d{1,16}$/.test(id)) ||
      !list(w.secrets, 20, member(SECRET_IDS)) || !list(w.history, 160, item => string(item, 240)) ||
      !list(w.sessions, 200, node) || !list(w.suspended, 3, member(PROCESS_IDS)) ||
      !list(w.favorites, commandNames.length, member(commandNames)) || !object(w.missions) ||
      !Object.entries(w.missions).every(([id, status]) => missions.some(m => m.id === id) && member(['active', 'complete', 'abandoned'])(status)) ||
      !list(w.omega, 80, item => object(item) && string(item.input, 240) && string(item.output, 600) && string(item.intent, 40))) throw new Error('Invalid or unsupported save.')
  const market = Object.hasOwn(w, 'market') ? w.market : {}
  if (!validMarket(market)) throw new Error('Invalid market ledger.')
  const checked = w as unknown as World
  const base = createWorld(checked.seed, checked.createdAt)
  if (checked.devices.some((device, i) => device.id !== nodes[i]) ||
      new Set(checked.events.map(e => e.id)).size !== checked.events.length ||
      checked.events.some(e => Number(e.id.slice(6)) > checked.sequence + 4)) throw new Error('Save contains inconsistent entity identifiers.')
  return { ...base, savedAt: checked.savedAt, started: checked.started, sequence: checked.sequence,
    devices: base.devices.map((device, i) => ({ ...device, state: checked.devices[i].state })),
    events: checked.events.map(e => ({ id: e.id, timestamp: e.timestamp, type: e.type, severity: e.severity,
      sourceEntityId: e.sourceEntityId, relatedEntityIds: e.relatedEntityIds, description: e.description,
      status: e.status, consequences: e.consequences, metadata: { channel: e.metadata.channel, message: e.metadata.message } })),
    seen: checked.seen, secrets: [...new Set(checked.secrets)], history: checked.history,
    sessions: [...new Set(checked.sessions)].filter(id => checked.devices[nodes.indexOf(id)].state !== 'isolated'),
    suspended: [...new Set(checked.suspended)], favorites: [...new Set(checked.favorites)], missions: checked.missions,
    market: { ...market },
    omega: checked.omega.map(({ input, output, intent }) => ({ input, output, intent })),
  }
}
let connection: Promise<IDBDatabase> | undefined
function database() {
  if (!connection) connection = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('ehx', 2)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('saves')) request.result.createObjectStore('saves')
    }
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Close other EHX tabs to update the local database.'))
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => { db.close(); connection = undefined }
      resolve(db)
    }
  }).catch(error => { connection = undefined; throw error })
  return connection
}
interface Snapshot { world?: World; revision: number }
function revisionOf(raw: unknown) {
  return object(raw) && integer(raw.revision) && Object.hasOwn(raw, 'world') ? raw.revision : 0
}
export async function loadSnapshot() {
  const db = await database()
  return new Promise<Snapshot>((resolve, reject) => {
    const request = db.transaction('saves').objectStore('saves').get('world')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      try {
        const raw: unknown = request.result
        const revision = revisionOf(raw)
        resolve({ revision, world: raw === undefined ? undefined : parseSave(revision && object(raw) ? raw.world : raw) })
      } catch (error) { reject(error) }
    }
  })
}
export async function loadWorld() {
  return (await loadSnapshot()).world
}
export async function saveWorld(world: World, expected?: number) {
  const db = await database()
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction('saves', 'readwrite')
    const store = transaction.objectStore('saves')
    const current = store.get('world')
    let next = 0
    let conflict = false
    current.onsuccess = () => {
      const revision = revisionOf(current.result)
      if (expected !== undefined && revision !== expected) {
        conflict = true
        transaction.abort()
        return
      }
      next = revision + 1
      store.put({ revision: next, world }, 'world')
    }
    transaction.oncomplete = () => resolve(next)
    transaction.onabort = () => reject(conflict ? new Error('Another EHX tab saved first. Export this session or reload to use the latest save.') : transaction.error ?? new Error('Save transaction aborted.'))
  })
}
