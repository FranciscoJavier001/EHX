import { marketAction, type MarketAction } from './market'
import { english, type Locale } from '../i18n/locale'
import { arcs, documents, missions, organizations, satellites } from '../content/catalog'
import { changeNode, discover, eventReport, eventSignal, initialSignal, PROCESS_IDS, visibleDocument, type World } from './world'
import { converse } from './omega'

export const modules = ['center', 'system', 'sigint', 'cyber', 'defense', 'orbital', 'osint', 'crypto', 'forensics', 'shadow', 'archive', 'omega', 'missions', 'settings', 'black', 'plus'] as const
export type Module = typeof modules[number]
export interface Reply { world: World; text: string; view?: Module; clear?: boolean }
type Handler = (w: World, arg: string, locale: Locale) => Omit<Reply, 'world'> & { world?: World }
const view = (module: Module): Handler => (_world, _arg, locale) => ({ view: module, text: locale.line('Opening ') + locale.t(module.toUpperCase()) })
function toggle(items: string[], item: string) {
  return items.includes(item) ? items.filter(value => value !== item) : [...items, item]
}
function nodeAction(state: 'isolated' | 'online'): Handler {
  return (w, arg, locale) => {
    const id = arg.toUpperCase()
    return w.devices.some(device => device.id === id)
      ? { world: changeNode(w, id, state), text: id + ' · ' + locale.t(state) }
      : { text: locale.line('Unknown node.') }
  }
}
function marketHandler(action: MarketAction): Handler {
  return (world, target, locale) => {
    const result = marketAction(world.market, action, target, locale)
    return { world: { ...world, market: result.ledger }, text: result.text }
  }
}
const registry: Record<string, Handler> = {
  help: (_world, _arg, locale) => ({ text: commandNames.join(' · ') + '\n' + locale.line("inspect NODE-042 | analyze SIGNAL-001 | open ARCHIVE-001 | solve KEYWORD | ask MESSAGE") }),
  clear: () => ({ text: '', clear: true }),
  status: (w, _arg, locale) => ({ text: w.devices.filter(n => n.state === 'online').length + locale.line(' nominal devices · ') + w.events.filter(e => e.status === 'open').length + locale.line(' open incidents') }),
  operator: (w, _arg, locale) => ({ text: w.operator + locale.line(' / ANONYMOUS') }),
  modules: () => ({ text: modules.join(' · ') }),
  black: view('black'), market: view('black'), plus: view('plus'), contract: marketHandler('contract'), review: marketHandler('review'),
  dispatch: marketHandler('dispatch'), publish: marketHandler('publish'), seal: marketHandler('seal'),
  system: view('system'), network: view('cyber'), nodes: view('cyber'), signals: view('sigint'), defense: view('defense'),
  incidents: view('defense'), orbital: view('orbital'), archive: view('archive'),
  missions: view('missions'), omega: view('omega'), settings: view('settings'), osint: view('osint'),
  crypto: view('crypto'), forensics: view('forensics'), shadow: view('shadow'), center: view('center'),
  history: (w, _arg, locale) => ({ text: w.history.slice(0, -1).slice(-15).join('\n') || locale.line('No previous commands.') }),
  favorite: (w, arg, locale) => commandNames.includes(arg) ? { world: { ...w, favorites: toggle(w.favorites, arg) }, text: locale.line('Favorites updated.') } : { text: locale.line('Choose a listed command.') },
  inspect: (w, arg, locale) => {
    const id = arg.toUpperCase()
    const node = w.devices.find(n => n.id === id)
    const craft = satellites.find(s => s.id === id)
    if (craft) return { world: discover(w, id), text: craft.name + ' · ' + craft.inclination + '° · ' + craft.period + locale.line(' minute orbit') }
    if (!node) return { text: locale.line('Unknown entity.') }
    return { world: discover(w, id), text: [node.id + ' / ' + node.name + ' / ' + locale.t(node.state), organizations[node.org] + ' · ' + node.os + locale.line(' · SECTOR ') + (node.network + 1), locale.line('Services: ') + node.services.join(', '), locale.line('Links: ') + node.related.join(', '), ...w.events.filter(e => e.sourceEntityId === id).slice(0, 5).map(e => e.id + ' ' + locale.eventType(e.type))].join('\n') }
  },
  open: (w, arg, locale) => {
    const id = arg.toUpperCase()
    const index = documents.findIndex(d => d.id === id)
    const event = w.events.find(e => eventReport(e) === id)
    if (event) return { world: discover(w, id), text: id + ' · ' + event.id + '\n' + locale.eventDescription(event) + '\n' + event.consequences.map(locale.consequence).join(' / ') }
    if (index < 0 || !visibleDocument(w, index)) return { text: locale.line('Record unavailable.') }
    const doc = documents[index]
    const localized = locale.document(doc)
    return { world: discover(w, id), text: localized.title + '\n' + doc.date + ' / ' + doc.owner + ' / ' + doc.node + '\n' + localized.body }
  },
  analyze: (w, arg, locale) => {
    const id = arg.toUpperCase()
    const family = arcs.findIndex((_, i) => initialSignal(i) === id)
    const event = w.events.find(e => eventSignal(e) === id)
    if (family >= 0) return { world: discover(w, id), text: id + ' · ' + arcs[family].node + '\n' + locale.line("Intercept: ") + arcs[family].cipher + '\n' + locale.line("Register offset: +3") }
    if (event) return { world: discover(w, id), text: id + ' / ' + event.sourceEntityId + ' / ' + locale.content(event.metadata.channel) + '\n' + locale.eventMessage(event) + '\n' + locale.line("Evidence: ") + event.id }
    return { text: locale.line('Unknown signal.') }
  },
  trace: (w, arg, locale) => {
    const event = w.events.find(e => e.id === arg.toUpperCase())
    return event ? { world: discover(w, event.id), text: [locale.eventDescription(event), new Date(event.timestamp).toISOString(), event.sourceEntityId, ...event.relatedEntityIds, eventSignal(event), eventReport(event), ...event.consequences.map(locale.consequence)].join('\n') } : { text: locale.line('Event unavailable.') }
  },
  isolate: nodeAction('isolated'), restore: nodeAction('online'),
  reject: (w, arg, locale) => {
    const event = w.events.find(entry => entry.id === arg.toUpperCase() && entry.type === 'Virtual link request' && entry.status === 'open')
    if (!event) return { text: locale.line('No pending link request by that ID.') }
    return { world: { ...w, events: w.events.map(e => e.id === event.id ? { ...e, status: 'resolved', consequences: [...e.consequences, 'Link rejected by operator'] } : e) }, text: locale.line('Link rejected.') }
  },
  connect: (w, arg, locale) => {
    const id = arg.toUpperCase()
    if (id === 'OMEGA') return { view: 'omega', text: locale.line('OMEGA carrier acquired.') }
    const device = w.devices.find(n => n.id === id)
    return device && device.state !== 'isolated' ? { world: { ...w, sessions: [...new Set([...w.sessions, id])] }, text: locale.line('Session open: ') + id } : { text: locale.line('Session unavailable.') }
  },
  disconnect: (w, arg, locale) => ({ world: { ...w, sessions: w.sessions.filter(id => id !== arg.toUpperCase()) }, text: locale.line('Session registry updated.') }),
  solve: (w, arg, locale) => {
    const family = arcs.findIndex(arc => arc.code === arg.toUpperCase())
    return family < 0 ? { text: locale.line('Key mismatch.') } : { world: discover(w, 'KEY-' + family), text: locale.line('Cipher key accepted.') }
  },
  ask: (w, arg, locale) => {
    if (!arg) return { text: locale.line('Usage: ask MESSAGE') }
    const response = converse(w, arg, locale)
    return { world: response.world, text: response.output }
  },
  accept: (w, arg, locale) => missionAction(w, arg, 'active', locale),
  abandon: (w, arg, locale) => missionAction(w, arg, 'abandoned', locale),
  witness: (w, arg, locale) => {
    const family = arcs.findIndex(arc => arc.node === arg.toUpperCase())
    if (family < 0 || !w.seen.includes(documents[family * 10 + 9].id)) return { text: locale.line('Unknown command. Enter help.') }
    return { text: locale.line('OBSERVER ANNOTATION / ') + locale.content(arcs[family].title) + '\n' + locale.content(arcs[family].link) }
  },
  process: (w, arg, locale) => PROCESS_IDS.includes(arg) ? { world: { ...w, suspended: toggle(w.suspended, arg) }, text: arg + locale.line(' process state toggled.') } : { text: locale.line('Unknown process.') },
}
function missionAction(w: World, arg: string, state: 'active' | 'abandoned', locale: Locale) {
  const mission = missions.find(item => item.id === arg.toUpperCase())
  if (!mission || w.missions[mission.id] === 'complete') return { text: locale.line('Mission unavailable.') }
  const next = { ...w, missions: { ...w.missions, [mission.id]: state } }
  return { world: discover(next, mission.id), text: locale.missionTitle(mission) + ' · ' + locale.t(next.missions[mission.id]) }
}
export const commandNames = Object.keys(registry).filter(command => command !== 'witness')
export function execute(world: World, input: string, locale = english): Reply {
  const clean = input.trim().slice(0, 240)
  if (!clean) return { world, text: '' }
  const [command, ...args] = clean.split(/\s+/)
  const key = command.toLowerCase()
  const next = { ...world, history: [...world.history, clean].slice(-160) }
  const reply = Object.hasOwn(registry, key) ? registry[key](next, args.join(' '), locale) : { text: locale.line('Unknown command. Enter help.') }
  const found = reply.world ?? next
  const discoveries = found.secrets.length - next.secrets.length
  const completed = missions.filter(mission => found.missions[mission.id] === 'complete' && next.missions[mission.id] !== 'complete')
  return { ...reply, world: found, text: [
    reply.text,
    ...(discoveries ? [locale.line('Discovery registry updated (+') + discoveries + ').'] : []),
    ...completed.map(mission => mission.id + locale.line(' complete. ') + locale.content(mission.consequence)),
  ].join('\n') }
}
