import { rng, type Device, type World } from './world'

export const topologyStates = [
  { id: 'observed', label: 'Recent activity' },
  { id: 'nominal', label: 'Nominal' },
  { id: 'linked', label: 'Active link' },
  { id: 'degraded', label: 'Degraded' },
  { id: 'critical', label: 'Critical / isolated' },
] as const

export function topologyState(world: World, node: Device): typeof topologyStates[number]['id'] {
  const incidents = world.events.filter(event => event.sourceEntityId === node.id && event.status === 'open')
  if (node.state === 'isolated' || incidents.some(event => event.severity === 'critical')) return 'critical'
  if (node.state === 'degraded' || incidents.length) return 'degraded'
  if (world.events.slice(0, 2).some(event => event.sourceEntityId === node.id)) return 'observed'
  if (world.sessions.includes(node.id) || world.events.slice(0, 4).some(event => event.relatedEntityIds.includes(node.id))) return 'linked'
  return 'nominal'
}

const regions = ['Americas', 'Europe', 'Asia-Pacific', 'Africa & Middle East'] as const

export function networkTraffic(world: World) {
  return regions.map((region, sector) => {
    const random = rng(world.seed ^ Math.imul(world.sequence + sector + 1, 2654435761))
    const nodes = world.devices.filter(node => node.network === sector)
    const capacity = nodes.reduce((sum, node) => sum + (node.state === 'online' ? 1 : node.state === 'degraded' ? .35 : 0), 0)
    const connections = nodes.filter(node => world.sessions.includes(node.id)).length
    const gbps = Math.round(capacity * (1.15 + random() * 1.3) + connections * 2)
    return { region, gbps }
  })
}

export function securityNews(world: World) {
  return world.events.filter(event => event.severity !== 'info').slice(0, 5)
}
