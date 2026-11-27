import { topologyState, topologyStates } from '../engine/telemetry'
import { useLocale } from './locale'
import { useEffect, useId, useRef } from 'react'
import { satellites } from '../content/catalog'
import { topologyDevices, topologyLinks, type World } from '../engine/world'

export function Topology({ world, onNode, orbital = false }: { world: World; onNode: (id: string) => void; orbital?: boolean }) {
  const { t } = useLocale()
  const pattern = useId()
  const points = [[73,72],[140,105],[105,178],[196,50],[217,129],[188,210],[286,83],[297,183],[360,43],[378,111],[369,214],[445,153],[465,83],[493,211]]
  return <svg className="topology" viewBox="0 0 560 260" role="group" aria-label={orbital ? t("Orbital map") : t("Network topology")}>
    <defs><pattern id={pattern} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#1b392b"/></pattern></defs>
    <rect width="560" height="260" fill={'url(#' + pattern + ')'}/>
    {orbital ? <>
      <circle cx="280" cy="130" r="31" fill="#11271d" stroke="#33855a"/>
      {satellites.map((sat, i) => <g key={sat.id} transform={'rotate(' + (i * 22.5) + ' 280 130)'}>
        <ellipse cx="280" cy="130" rx={78 + i * 10} ry={29 + i * 4} fill="none" stroke="#26513a"/>
        <circle className="satellite"
          cx={280 + Math.cos(sat.phase * Math.PI / 180 + world.sequence / 10) * (78 + i * 10)}
          cy={130 + Math.sin(sat.phase * Math.PI / 180 + world.sequence / 10) * (29 + i * 4)} r="4" fill="#66ffa2"/>
      </g>)}
    </> : <>
      <path d="M 280 27 V 233 M 38 130 H 522" stroke="#183125" strokeDasharray="3 6"/>
      <circle cx="280" cy="130" r="97" fill="none" stroke="#173126"/>
      <circle cx="280" cy="130" r="57" fill="none" stroke="#173126"/>
      {topologyLinks.map(([a, b]) => <line key={a + '-' + b} x1={points[a][0]} y1={points[a][1]} x2={points[b][0]} y2={points[b][1]} stroke={a === 4 || a === 6 ? '#2e7952' : '#254636'}/>)}
      {points.map(([x,y], i) => {
        const node = world.devices[topologyDevices[i]]
        const state = topologyState(world, node)
        const stateLabel = t(topologyStates.find(item => item.id === state)!.label)
        return <g key={node.id} tabIndex={0} role="button" className={"topology-" + state} aria-label={t("Inspect ") + node.id + " · " + stateLabel} onClick={() => onNode(node.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onNode(node.id) } }}>
          <title>{node.id} · {stateLabel}</title>
          <circle cx={x} cy={y} r="16" fill="transparent"/>
          <circle cx={x} cy={y} r={i === 4 || i === 6 ? 11 : 7} fill="#0a1710" stroke="currentColor" strokeOpacity=".5"/>
          <circle cx={x} cy={y} r={i === 4 || i === 6 ? 4 : 2.7} fill="currentColor" className={state === 'observed' || state === 'linked' ? 'beacon network-beacon' : ''}/>
          {[0,4,6,9,13].includes(i) && <text x={x + 11} y={y - 10} fill="#87a394" fontSize="10">{node.id}</text>}
        </g>
      })}
    </>}
  </svg>
}

export function Wave({ sequence }: { sequence: number }) {
  const { t } = useLocale()
  const lines = Array.from({ length: 100 }, (_, i) => (i * 6) + ',' + (45 + Math.sin(i * .66 + sequence) * Math.cos(i * .25) * 30)).join(' ')
  return <svg className="wave" viewBox="0 0 594 90" role="img" aria-label={t("Signal waveform")}><path d="M0 45H594" stroke="#264835"/><polyline points={lines} fill="none" stroke="#53f890" strokeWidth="1.7"/></svg>
}


export function Spectrum({ sequence }: { sequence: number }) {
  const { t } = useLocale()
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, 600, 75)
    for (let i = 0; i < 60; i++) {
      const height = 5 + 60 * Math.abs(Math.sin(i * .27 + sequence * .07) * Math.sin(i * .079))
      context.fillStyle = i % 5 === 0 ? '#60ef8b' : '#286e46'
      context.fillRect(i * 10 + 1, 75 - height, 7, height)
    }
  }, [sequence])
  return <canvas className="spectrum" ref={canvas} width="600" height="75" role="img" aria-label={t("Signal spectrum")}/>
}
