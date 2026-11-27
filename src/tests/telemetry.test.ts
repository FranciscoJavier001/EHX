import { expect, it } from 'vitest'
import { networkTraffic, securityNews, topologyState } from '../engine/telemetry'
import { advance, changeNode, createWorld, type WorldEvent } from '../engine/world'

it('derives all five map colors from sessions, observations and incident status', () => {
  const world = { ...createWorld(9, 100), events: [] }
  const node = world.devices[0]
  const sample = createWorld(9, 100).events[0]
  const observation: WorldEvent = { ...sample, sourceEntityId: node.id, severity: 'info', status: 'observed' }
  const incident: WorldEvent = { ...observation, severity: 'critical', status: 'open' }
  expect(topologyState(world, node)).toBe('nominal')
  expect(topologyState({ ...world, sessions: [node.id] }, node)).toBe('linked')
  expect(topologyState({ ...world, events: [observation] }, node)).toBe('observed')
  expect(topologyState({ ...world, events: [{ ...incident, severity: 'warning' }] }, node)).toBe('degraded')
  expect(topologyState({ ...world, events: [incident] }, node)).toBe('critical')
  const isolated = changeNode(world, node.id, 'isolated')
  expect(topologyState(isolated, isolated.devices[0])).toBe('critical')
})

it('provides reproducible traffic snapshots and reports traceable incidents', () => {
  const world = createWorld(9, 100)
  const first = networkTraffic(world)
  expect(first).toEqual(networkTraffic(createWorld(9, 100)))
  expect(networkTraffic(advance(world, 120))).not.toEqual(first)
  expect(first).toHaveLength(4)
  const reports = securityNews(world)
  expect(reports.length).toBeGreaterThan(0)
  expect(reports.every(event => world.events.includes(event) && event.severity !== 'info')).toBe(true)
})
