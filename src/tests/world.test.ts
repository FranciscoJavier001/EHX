import { english, spanish } from '../i18n/locale'
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { arcs, documents, eventTypes, missions, organizations, operators, satellites, transmissions } from '../content/catalog'
import { execute } from '../engine/commands'
import { advance, catchUp, createWorld, eventReport, eventSignal, SECRET_IDS } from '../engine/world'
import { loadSnapshot, loadWorld, parseSave, saveWorld } from '../database/save'

const epoch = 1_700_000_000_000
const fixture = () => createWorld(719, epoch)

describe('universe', () => {
  it('generates the requested content and stable device metadata', () => {
    const world = fixture()
    expect(world).toEqual(fixture())
    expect(world.devices).not.toEqual(createWorld(720, epoch).devices)
    expect(new Set(world.devices.map(device => device.id)).size).toBe(200)
    expect([organizations.length, operators.length, satellites.length, eventTypes.length, transmissions.length, documents.length, missions.length, SECRET_IDS.length, arcs.length]).toEqual([12, 20, 8, 30, 100, 40, 15, 20, 4])
  })
  it('shares event evidence across commands and retains unresolved incidents', () => {
    let world = fixture()
    for (let index = 0; index < 500; index++) world = advance(world, epoch + index)
    const ids = new Set(world.devices.map(node => node.id))
    expect(world.events.length).toBeLessThanOrEqual(145)
    expect(world.events.every(e => ids.has(e.sourceEntityId) && e.relatedEntityIds.every(id => ids.has(id)))).toBe(true)
    const event = world.events.find(e => e.status === 'open' && e.type !== 'Virtual link request')!
    expect(execute(world, 'trace ' + event.id).text).toContain(eventReport(event))
    expect(execute(world, 'analyze ' + eventSignal(event)).text).toContain(event.id)
    expect(execute(world, 'open ' + eventReport(event)).text).toContain(event.description)
    world = execute(world, 'isolate ' + event.sourceEntityId).world
    expect(execute(world, 'connect ' + event.sourceEntityId).text).toContain('unavailable')
    world = execute(world, 'restore ' + event.sourceEntityId).world
    expect(world.events.find(item => item.id === event.id)?.status).toBe('resolved')
  })
  it('bounds retrospective changes and handles backwards clocks', () => {
    const world = fixture()
    expect(catchUp(world, epoch - 500).events).toEqual(world.events)
    expect(catchUp(world, epoch + 86400000).sequence).toBe(world.sequence + 12)
    expect(catchUp(world, epoch + 86400000)).toEqual(catchUp(fixture(), epoch + 86400000))
  })
})

describe('commands, discovery and OMEGA', () => {
  it('rejects prototype names and destinations outside the world', () => {
    const world = fixture()
    for (const command of ['constructor', '__proto__', 'fetch https://example.org']) expect(execute(world, command).text).toMatch(/unknown command/i)
    expect(execute(world, 'connect example.org').world.sessions).toEqual([])
    expect(execute(world, 'help').text).toContain('inspect')
  })
  it('links discoveries, optional missions, gated records and memory', () => {
    let world = fixture()
    const run = (command: string) => { const reply = execute(world, command); world = reply.world; return reply.text }
    expect(run('open ARCHIVE-007')).toMatch(/unavailable/)
    run('accept MISSION-1')
    run('inspect NODE-042')
    run('analyze SIGNAL-001')
    run('open ARCHIVE-001')
    expect(world.missions['MISSION-1']).toBe('complete')
    expect(world.secrets).toEqual(['SECRET-1'])
    expect(run('ask for a hint')).toContain('HPEHU')
    run('solve EMBER')
    run('open ARCHIVE-007')
    expect(run('ask about The Quiet Relay')).toContain('Glass Harbour')
    expect(world.secrets).toEqual(SECRET_IDS.slice(0, 5))
    expect(run('ask do you remember')).toContain('The Quiet Relay')
    expect(run('witness NODE-042')).toContain('Unknown command')
    expect(run('open ARCHIVE-010')).toContain('witness NODE-042')
    expect(run('witness NODE-042')).toContain('OBSERVER ANNOTATION')
    expect(run('help')).not.toContain('witness')
    run('accept MISSION-2')
    run('abandon MISSION-2')
    expect(world.missions['MISSION-2']).toBe('abandoned')
  })
})

describe('storage and import', () => {
  it('round trips a save through IndexedDB', async () => {
    const world = execute(fixture(), 'operator').world
    await saveWorld(world)
    expect(await loadWorld()).toEqual(world)
    const revision = (await loadSnapshot()).revision
    const next = execute(world, 'status').world
    await saveWorld(next, revision)
    await expect(saveWorld(world, revision)).rejects.toThrow('Another EHX tab saved first')
    expect(await loadWorld()).toEqual(next)
  })
  it('migrates version 1 and rejects malformed or inconsistent records', () => {
    const world = fixture()
    expect(parseSave({ ...world, version: 1, favorites: undefined, suspended: undefined, sessions: undefined })).toEqual(world)
    const invalid = [{ ...world, version: 3 }, { ...world, seed: '5' }, { ...world, devices: world.devices.slice(1) },
      { ...world, events: [{ ...world.events[0], sourceEntityId: 'NODE-999' }] }, { ...world, events: [world.events[0], world.events[0]] }]
    for (const entry of invalid) expect(() => parseSave(entry)).toThrow()
  })
})

describe('bilingual console', () => {
  it('localizes replies without changing state or command syntax', () => {
    const world = fixture()
    const englishReply = execute(world, 'open ARCHIVE-001', english)
    const spanishReply = execute(world, 'open ARCHIVE-001', spanish)
    expect(spanishReply.world).toEqual(englishReply.world)
    expect(spanishReply.text).toContain('El repetidor silencioso / Comunicado público')
    expect(spanishReply.text).toContain('Vesper ocultó')
    expect(execute(world, 'analyze SIGNAL-001', spanish).text).toContain('Desfase del registro: +3')
    expect(execute(world, 'help', spanish).text).toContain('solve CLAVE')
    expect(execute(world, 'operator').text).toBe(world.operator + ' / ANONYMOUS')
    expect(execute(world, 'operator', spanish).text).toBe(world.operator + ' / ANÓNIMO')
  })

  it('understands Spanish OMEGA requests and translated story titles', () => {
    const world = fixture()
    expect(execute(world, 'ask ¿Me das una pista?', spanish).text).toContain('Inspecciona NODE-042')
    expect(execute(world, 'ask El repetidor silencioso', spanish).text).toContain('Reconozco el título')
    expect(execute(world, 'ask ¿Quién eres?', english).text).toContain('The margin')
  })

  it('renders older link requests in both languages', () => {
    const event = {
      ...fixture().events[0], type: 'Virtual link request', description: 'Virtual link request at RELAY-042',
      metadata: { channel: 'relay', message: 'Virtual link request logged on the relay channel' },
    }
    expect(english.eventDescription(event)).toBe('Link request at RELAY-042')
    expect(spanish.eventMessage(event)).toBe('Solicitud de enlace · canal de repetidor')
    expect(spanish.consequence('Virtual link pending review')).toBe('Enlace pendiente de revisión')
  })
})
