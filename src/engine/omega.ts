import { english, spanish, type Locale } from '../i18n/locale'
import { arcs, missions, organizations, satellites } from '../content/catalog'
import { discover, SECRET_IDS, type World } from './world'

const intents: [string, RegExp, (w: World, locale: Locale) => string][] = [
  ['identity', /who are you|identity/, (_world, locale) => locale.line('OMEGA. The margin in which the timing crew left their notes.')],
  ['greeting', /hello|^hi$|greetings/, (w, locale) => locale.line('Carrier acquired, ') + w.operator + '.'],
  ['incident', /incident|anomaly/, (w, locale) => {
    const event = w.events.find(e => e.status === 'open')
    return event ? locale.eventDescription(event) : locale.line('There are no open incident records.')
  }],
  ['mission', /mission|assignment/, (w, locale) => {
    const mission = missions.find(m => !w.missions[m.id])
    return mission ? locale.line('Suggested investigation: ') + locale.missionTitle(mission) : locale.line('Review your existing assignments.')
  }],
  ['hint', /hint|clue|help/, (w, locale) => {
    const index = arcs.findIndex((_, family) => !w.secrets.includes(SECRET_IDS[family * 5 + 4]))
    if (index < 0) return locale.line('All four observers have been identified. Compare their sealed conclusions.')
    const arc = arcs[index]
    const clues = [locale.line('Inspect ') + arc.node + locale.line(' and analyze ') + 'SIGNAL-00' + (index + 1) + '.', locale.line('Shift each letter of ') + arc.cipher + locale.line(' backward by three.'), locale.line('Open the public dispatch for ') + locale.content(arc.title) + '.', locale.line('Read the restricted ledger for ') + locale.content(arc.title) + '.', locale.line('Tell me about ') + locale.content(arc.title) + '.']
    const stage = SECRET_IDS.slice(index * 5, index * 5 + 4).findIndex(id => !w.secrets.includes(id))
    return clues[stage < 0 ? 4 : stage]
  }],
  ['memory', /remember|memory/, (w, locale) => w.omega.length ? locale.line('Previous inquiry: ') + w.omega.at(-1)?.input : locale.line('This is our first recorded exchange.')],
  ['operator', /operator/, (w, locale) => locale.line('The console identifies you as ') + w.operator + '.'],
  ['node', /node|relay/, (w, locale) => locale.line('The topology contains ') + w.devices.length + locale.line(' registered devices.')],
  ['signal', /signal|carrier/, (w, locale) => locale.line('Most recent channel: ') + locale.content(w.events[0]?.metadata.channel ?? '') + '.'],
  ['archive', /archive|document/, (_world, locale) => locale.line('Start with the public dispatches. The restricted ledgers follow their numbering.')],
  ['shadow', /shadow|hidden/, (w, locale) => w.secrets.length ? locale.line('The hidden registry has recorded your discoveries.') : locale.line('Two independent observations establish a contact.')],
  ['abyss', /abyss|sealed/, (_world, locale) => locale.line('A sealed record follows each restricted ledger.')],
  ['orbital', /satellite|orbit/, (_world, locale) => locale.line('Tracked craft: ') + satellites.map(s => s.name).join(', ') + '.'],
  ['organization', /organization|consortium/, (_world, locale) => organizations.slice(0, 4).join(', ') + locale.line(' share the charter.')],
  ['cipher', /cipher|crypto|decode/, (_world, locale) => locale.line('The timing crew shifted letters, preserving their order.')],
  ['clock', /clock|timing/, (_world, locale) => locale.line('The reserve clock survived its scheduled removal.')],
  ['defense', /defense|isolate/, (w, locale) => w.devices.filter(n => n.state === 'isolated').length + locale.line(' devices are isolated.')],
  ['restore', /restore|recover/, (_world, locale) => locale.line('Defense can restore the affected service and close its incident records.')],
  ['forensics', /forensics|trace/, (w, locale) => locale.line('The latest timeline entry is ') + w.events[0]?.id + '.'],
  ['osint', /osint|search|public/, (_world, locale) => locale.line('Search the public catalog for a dispatch title, organization, or relay identifier.')],
  ['network', /network|topology/, (_world, locale) => locale.line('The topology groups devices into four sectors.')],
  ['systems', /kernel|system/, (w, locale) => w.suspended.length + locale.line(' processes suspended.')],
  ['health', /integrity|health|status/, (w, locale) => w.devices.filter(n => n.state === 'online').length + locale.line(' devices report nominal state.')],
  ['date', /date|when/, (w, locale) => locale.line('The earliest available record is ') + new Date(w.createdAt).toISOString() + '.'],
  ['report', /report|evidence/, (w, locale) => locale.line('The latest evidence record corresponds to ') + w.events[0]?.id + '.'],
  ['quiet', /quiet|silence/, (_world, locale) => locale.line('Listen for the spaces between observation pulses.')],
  ['thanks', /thank/, (_world, locale) => locale.line('Acknowledgment filed.')],
  ['goodbye', /bye|disconnect/, (_world, locale) => locale.line('Carrier released. The ledger remains.')],
  ['authorization', /authorization|access/, (w, locale) => w.secrets.length + locale.line(' entries have been added to your discovery log.')],
  ['history', /history|timeline/, (w, locale) => w.sequence + locale.line(' events have entered the ledger.')],
]

const spanishIntents: Record<string, RegExp> = {
  identity: /quien eres|identidad/, greeting: /hola|saludos/, incident: /incidente|anomalia/,
  mission: /mision|misiones|tarea/, hint: /pista|ayuda|indicio/, memory: /recuerd|memoria/,
  operator: /operador/, node: /nodo|repetidor/, signal: /senal|portadora/,
  archive: /archivo|documento/, shadow: /sombra|oculto/, abyss: /abismo|sellado/,
  orbital: /satelite|orbita/, organization: /organizacion|consorcio/, cipher: /cifrado|descifrar/,
  clock: /reloj|sincronizacion/, defense: /defensa|aislar/, restore: /restaur|recuper/,
  forensics: /forense|rastreo/, osint: /busca|publico/, network: /\bred\b|topologia/,
  systems: /nucleo|sistema/, health: /integridad|salud|estado/, date: /fecha|cuando/,
  report: /informe|evidencia/, quiet: /silencio|silencioso/, thanks: /gracias/,
  goodbye: /adios|hasta luego/, authorization: /autorizacion|acceso/, history: /historial|cronologia/,
}
const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')

export function converse(world: World, input: string, locale = english) {
  const query = normalize(input)
  const family = arcs.findIndex(arc => [arc.title, spanish.content(arc.title)].some(title => query.includes(normalize(title))))
  const intent = intents.find(([name, pattern]) => pattern.test(query) || spanishIntents[name]?.test(query))
  const revealed = family >= 0 && world.secrets.includes(SECRET_IDS[family * 5 + 3])
  const next = revealed ? discover(world, 'OMEGA-' + family) : world
  const output = revealed ? locale.content(arcs[family].link) : family >= 0 ? locale.line('I recognize the title. Bring me the restricted ledger.') :
    intent?.[2](next, locale) ?? (world.omega.length % 5 === 4 ? locale.line('Somewhere in the ledger, two observations share a timestamp.') : locale.line('I have no record under that term. Ask about the current incident, a mission, or a clue.'))
  return { output, world: { ...next, omega: [...next.omega, { input, output, intent: family >= 0 ? 'arc' : intent?.[0] ?? 'unknown' }].slice(-80) } }
}
