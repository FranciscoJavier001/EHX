import type { MarketLedger } from '../content/market'
import { arcs, documents, eventTypes, missions, operators, organizations, transmissions } from '../content/catalog'

export type NodeState = 'online' | 'degraded' | 'isolated'
export interface Device {
  id: string
  name: string
  org: number
  os: string
  network: number
  services: string[]
  related: string[]
  state: NodeState
}
export interface WorldEvent {
  id: string
  timestamp: number
  type: string
  severity: 'info' | 'warning' | 'critical'
  sourceEntityId: string
  relatedEntityIds: string[]
  description: string
  status: 'observed' | 'open' | 'resolved'
  consequences: string[]
  metadata: { channel: string; message: string }
}
export interface World {
  version: 2
  seed: number
  operator: string
  createdAt: number
  savedAt: number
  sequence: number
  started: boolean
  devices: Device[]
  events: WorldEvent[]
  seen: string[]
  secrets: string[]
  missions: Record<string, 'active' | 'complete' | 'abandoned'>
  history: string[]
  favorites: string[]
  omega: { input: string; output: string; intent: string }[]
  sessions: string[]
  suspended: string[]
  market: MarketLedger
}
export function rng(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}
export const nodeId = (index: number) => 'NODE-' + String(index + 1).padStart(3, '0')
export const eventSignal = (event: WorldEvent) => event.id.replace('EVENT-', 'SIGNAL-')
export const eventReport = (event: WorldEvent) => event.id.replace('EVENT-', 'REPORT-')
export const initialSignal = (family: number) => 'SIGNAL-00' + (family + 1)
export const SECRET_IDS = arcs.flatMap((_, family) => Array.from({ length: 5 }, (_, index) => 'SECRET-' + (family * 5 + index + 1)))
export const PROCESS_IDS = ['clockd', 'spoold', 'observerd']
export const has = (world: World, item: string) => world.seen.includes(item) || world.secrets.includes(item)

export const topologyDevices = [41, 8, 14, 72, 0, 54, 95, 31, 84, 124, 17, 103, 167, 198]
export const topologyLinks = [[0,1],[0,3],[1,2],[1,4],[2,5],[3,4],[3,6],[4,5],[4,6],[4,7],[5,7],[6,8],[6,9],[7,9],[7,10],[8,9],[8,12],[9,10],[9,11],[10,11],[11,12],[11,13]]
function relatedNodes(index: number) {
  const position = topologyDevices.indexOf(index)
  const neighbors = topologyLinks.filter(link => link.includes(position)).map(([a, b]) => nodeId(topologyDevices[a === position ? b : a]))
  return [...new Set([...neighbors, nodeId((index + 1) % 200), nodeId((index + 12) % 200)])]
}

export function createWorld(seed: number, timestamp: number): World {
  const random = rng(seed)
  const devices = Array.from({ length: 200 }, (_, index): Device => {
    const arc = arcs.find(item => item.node === nodeId(index))
    const org = arc?.owner ?? Math.floor(random() * organizations.length)
    const role = ['RELAY', 'LEDGER', 'BEACON', 'OBSERVER', 'ARRAY'][Math.floor(random() * 5)]
    return { id: nodeId(index), name: role + '-' + String(index + 1).padStart(3, '0'), org, os: ['VESPER/4', 'MORROW/8', 'KITE/2'][org % 3], network: org % 4, services: [role.toLowerCase(), 'clock'], related: relatedNodes(index), state: 'online' }
  })
  let world: World = {
    version: 2, seed, operator: 'EHX-' + (seed & 65535).toString(16).toUpperCase().padStart(4, '0'),
    createdAt: timestamp, savedAt: timestamp, sequence: 0, started: false, devices, events: [],
    seen: [], secrets: [], missions: {}, history: [], favorites: ['status', 'nodes', 'signals'], omega: [], sessions: [], suspended: [], market: {},
  }
  for (let index = 0; index < 6; index++) world = advance(world, timestamp)
  return world
}
export function advance(world: World, timestamp: number): World {
  const random = rng(world.seed ^ Math.imul(world.sequence + 1, 2654435761))
  const candidates = world.devices.filter(device => device.state === 'online')
  if (!candidates.length) return world
  const device = candidates[Math.floor(random() * candidates.length)]
  const eventIndex = Math.floor(random() * eventTypes.length)
  const type = eventTypes[eventIndex]
  const template = transmissions[(eventIndex % 10) * 10 + Math.floor(random() * 10)]
  const metadata = { ...template, message: eventIndex < 10 ? template.message : type + ' logged on the ' + template.channel + ' channel' }
  const sequence = world.sequence + 1
  const open = [0, 1, 3, 5, 6, 11, 15, 18, 22, 25, 26, 28].includes(eventIndex) && world.events.filter(event => event.status === 'open').length < 24
  const severity = open ? (eventIndex === 15 ? 'critical' : 'warning') : 'info'
  const event: WorldEvent = {
    id: 'EVENT-' + String(sequence + 4).padStart(3, '0'), timestamp, type, severity,
    sourceEntityId: device.id, relatedEntityIds: device.related,
    description: type + ' at ' + device.name + ' · ' + organizations[device.org],
    status: open ? 'open' : 'observed',
    consequences: [open ? (eventIndex === 25 ? 'Link pending review' : 'Device degraded') : 'Record filed', 'Signal and report linked'],
    metadata,
  }
  return { ...world, sequence,
    devices: open && eventIndex !== 25 ? world.devices.map(item => item.id === device.id ? { ...item, state: 'degraded' } : item) : world.devices,
    events: [event, ...world.events.filter((entry, index) => index < 119 || entry.status === 'open')].slice(0, 145),
  }
}
export function catchUp(world: World, now: number) {
  const interval = 5 * 60_000
  const count = Math.min(12, Math.max(0, Math.floor((now - world.savedAt) / interval)))
  for (let index = 1; index <= count; index++) world = advance(world, now - (count - index) * interval)
  return { ...world, savedAt: now }
}
export function discover(world: World, item: string) {
  const seen = [...world.seen.filter(id => id !== item), item].slice(-1000)
  const secrets = new Set(world.secrets)
  arcs.forEach((arc, family) => {
    const base = family * 5
    const archive = documents[family * 10].id
    const mark = (offset: number, condition: boolean) => { if (condition) secrets.add(SECRET_IDS[base + offset]) }
    mark(0, seen.includes(arc.node) && seen.includes(initialSignal(family)))
    mark(1, seen.includes('KEY-' + family))
    mark(2, secrets.has(SECRET_IDS[base]) && secrets.has(SECRET_IDS[base + 1]) && seen.includes(archive))
    mark(3, secrets.has(SECRET_IDS[base + 2]) && seen.includes(documents[family * 10 + 6].id))
    mark(4, secrets.has(SECRET_IDS[base + 3]) && seen.includes('OMEGA-' + family))
  })
  const next = { ...world, seen, secrets: [...secrets], missions: { ...world.missions } }
  for (const mission of missions) {
    if (next.missions[mission.id] === 'active' && mission.objectives.every(id => has(next, id))) next.missions[mission.id] = 'complete'
  }
  return next
}
export function changeNode(world: World, id: string, state: NodeState) {
  return { ...world, devices: world.devices.map(node => node.id === id ? { ...node, state } : node),
    sessions: state === 'isolated' ? world.sessions.filter(node => node !== id) : world.sessions,
    events: state === 'online' ? world.events.map(event => event.sourceEntityId === id && event.status === 'open'
      ? { ...event, status: 'resolved' as const, consequences: [...event.consequences, 'Operator restored service'] } : event) : world.events }
}
export function visibleDocument(world: World, index: number) {
  const document = documents[index]
  const offset = document.family * 5
  return document.index <= 4 || world.secrets.includes(SECRET_IDS[offset + (document.index <= 7 ? 2 : 3)])
}
export function sender(seed: number) {
  return operators[seed % operators.length]
}
