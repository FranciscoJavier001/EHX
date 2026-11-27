import { expect, it } from 'vitest'
import { execute } from '../engine/commands'
import { credits } from '../engine/market'
import { createWorld } from '../engine/world'
import { parseSave } from '../database/save'
import { spanish } from '../i18n/locale'

it('unlocks the frontier commission after the two audits and persists either outcome', () => {
  let world = createWorld(9, 12345)
  const run = (command: string) => {
    const reply = execute(world, command, spanish)
    world = reply.world
    return reply.text
  }
  expect(run('contract MKT-03')).toContain('Acción no disponible')
  expect(run('review MKT-01')).toContain('Acción no disponible')
  run('contract MKT-01')
  expect(run('review MKT-01')).toContain('apagón')
  run('contract MKT-02')
  run('review MKT-02')
  expect(credits(world.market)).toBe(400)
  run('contract MKT-03')
  expect(run('dispatch MKT-03')).toContain('nunca llegaron a la Línea Sable')
  const alternate = execute(world, 'seal MKT-03').world
  expect(credits(alternate.market)).toBe(1000)
  expect(run('publish MKT-03')).toContain('Evidencia publicada')
  expect(credits(world.market)).toBe(400)
  expect(run('seal MKT-03')).toContain('Acción no disponible')
  expect(parseSave(JSON.parse(JSON.stringify(world)))).toEqual(world)
  expect(parseSave(alternate).market['MKT-03']).toBe('sealed')
})

it('loads older saves and rejects invalid ledger states or external targets', () => {
  const world = createWorld(9, 12345)
  const legacy: Partial<typeof world> = { ...world }
  delete legacy.market
  expect(parseSave(legacy).market).toEqual({})
  expect(() => parseSave({ ...world, market: { 'MKT-03': 'sealed' } })).toThrow('Invalid market ledger')
  expect(() => parseSave({ ...world, market: { 'MKT-01': 'published' } })).toThrow('Invalid market ledger')
  expect(execute(world, 'review https://example.org').world.market).toEqual({})
})
