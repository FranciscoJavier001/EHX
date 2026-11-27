import { expect, it } from 'vitest'
import { commandGroups, operatorRoute } from '../content/plus'
import { commandNames, execute } from '../engine/commands'
import { createWorld } from '../engine/world'

it('lists every public command and preserves the market alias', () => {
  expect(Object.values(commandGroups).flat().filter(name => name !== 'witness').sort()).toEqual([...commandNames].sort())
  const world = createWorld(9, 12345)
  expect(execute(world, 'black').view).toBe('black')
  expect(execute(world, 'market').view).toBe('black')
  expect(execute(world, 'plus').view).toBe('plus')
})

it('plays the PLUS route from a new world through the first case and BLACK decision', () => {
  let world = createWorld(9, 12345)
  for (const stage of operatorRoute) {
    for (const command of [...stage.commands, ...(stage.choices?.slice(0, 1) ?? [])]) {
      const reply = execute(world, command.replace('KEYWORD', 'EMBER'))
      expect(reply.text).not.toMatch(/unavailable|unknown command|key mismatch/i)
      world = reply.world
    }
  }
  expect(world.missions['MISSION-1']).toBe('complete')
  expect(world.secrets).toContain('SECRET-5')
  expect(world.seen).toContain('ARCHIVE-010')
  expect(world.market['MKT-03']).toBe('published')
})
