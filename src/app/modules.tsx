import Market from './Market'
import { useLocale } from './locale'
import { useState, type ReactNode } from 'react'
import { Panel } from './ui'
import { arcs, documents, missions, organizations, satellites } from '../content/catalog'
import { eventReport, eventSignal, initialSignal, PROCESS_IDS, SECRET_IDS, sender, visibleDocument, type World } from '../engine/world'
import type { Module } from '../engine/commands'
import { Spectrum, Topology, Wave } from './visuals'

function Row({ id, name, info, children }: { id: string; name: string; info?: string; children?: ReactNode }) {
  return <div className="record"><div><span className="id">{id}</span><strong>{name}</strong>{info && <small>{info}</small>}</div><div className="actions">{children}</div></div>
}
export default function Department({ module, world, run }: { module: Module; world: World; run: (command: string) => void }) {
  const { t, eventDescription, eventMessage, document, missionTitle, content } = useLocale()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [input, setInput] = useState('')
  const action = (label: string, command: string) => <button onClick={() => run(command)}>{label}</button>
  const contains = (text: string) => text.toLowerCase().includes(query.trim().toLowerCase())
  const search = (label: string) => <input className="search" aria-label={label} type="search" placeholder={label} value={query} onChange={event => { setQuery(event.target.value); setPage(0) }}/>
  switch (module) {
    case 'system': return <Panel title={t("Kernel")} detail="EHX / 02">
      <Row id={t("KERNEL")} name={t("Vesper microkernel")} info={world.devices.length + t(" device records · ") + world.sessions.length + t(" active sessions")} />
      <Row id={t("MEMORY")} name={world.events.length + t(" / 145 log slots")} info={world.suspended.length + t(" suspended processes · ") + world.sequence + t(" processed events")}/>
      <Row id="CPU" name={(12 + (PROCESS_IDS.length - world.suspended.length) * 9 + world.events.filter(event => event.status === 'open').length) + t("% load")} info={world.devices.filter(node => node.state === 'online').reduce((sum, node) => sum + node.services.length, 0) + t(" nominal services")}/>
      {PROCESS_IDS.map(id => <Row key={id} id={id} name={world.suspended.includes(id) ? t("Suspended") : t("Running")}>{action(world.suspended.includes(id) ? t("Resume") : t("Suspend"), 'process ' + id)}</Row>)}
    </Panel>
    case 'sigint': return <Panel title={t("Signal register")} detail={t("MONITORED FEED")}><Wave sequence={world.sequence}/><Spectrum sequence={world.sequence}/>
      {arcs.map((arc, i) => <Row key={arc.node} id={initialSignal(i)} name={t("Fragmented transmission / ") + organizations[arc.owner]} info={sender(i) + ' · ' + arc.node}>{action(t("Analyze"), 'analyze ' + initialSignal(i))}</Row>)}
      {world.events.slice(0, 16).map(event => <Row key={event.id} id={eventSignal(event)} name={eventMessage(event)} info={content(event.metadata.channel) + ' · ' + event.sourceEntityId}>{action(t("Analyze"), 'analyze ' + eventSignal(event))}</Row>)}
    </Panel>
    case 'cyber': {
      const matches = world.devices.filter(node => contains([node.id, node.name, organizations[node.org], node.state, t(node.state)].join(' ')))
      return <Panel title={t("Device registry")} detail={matches.length + t(" DEVICES")}>{search(t("Search device registry"))}
        {matches.slice(page * 15, page * 15 + 15).map(node => <Row key={node.id} id={node.id} name={node.name} info={organizations[node.org] + ' · ' + t(node.state)}>{action(t("Inspect"), 'inspect ' + node.id)}{action(world.sessions.includes(node.id) ? t("Disconnect") : t("Connect"), (world.sessions.includes(node.id) ? 'disconnect ' : 'connect ') + node.id)}</Row>)}
        <div className="actions padding"><button disabled={page === 0} onClick={() => setPage(page - 1)}>{t("Previous")}</button><button disabled={(page + 1) * 15 >= matches.length} onClick={() => setPage(page + 1)}>{t("Next")}</button></div>
      </Panel>
    }
    case 'defense': {
      const open = world.events.filter(event => event.status === 'open')
      return <Panel title={t("Incident queue")} detail={open.length + t(" OPEN")}>
        {open.length === 0 && <p className="padding dim">{t("No unresolved incidents.")}</p>}
        {open.map(event => <Row key={event.id} id={event.id} name={eventDescription(event)} info={t(event.severity) + ' · ' + event.sourceEntityId}>{action(t("Investigate"), 'trace ' + event.id)}{action(t("Report"), 'open ' + eventReport(event))}{event.type === 'Virtual link request' ? action(t("Reject"), 'reject ' + event.id) : <>{action(t("Isolate"), 'isolate ' + event.sourceEntityId)}{action(t("Restore"), 'restore ' + event.sourceEntityId)}</>}</Row>)}
        {world.devices.filter(device => device.state === 'isolated').map(device => <Row key={device.id} id={device.id} name={t("Isolation active")}>{action(t("Restore"), 'restore ' + device.id)}</Row>)}
      </Panel>
    }
    case 'orbital': return <Panel title={t("Orbital constellation")} detail={t("8 SPACECRAFT")}><Topology world={world} orbital onNode={() => undefined}/>
      {satellites.map((sat, index) => <Row key={sat.id} id={sat.id} name={sat.name} info={sat.inclination + t("° inclination · ") + (70 + (world.sequence + index * 7) % 30) + t("% power · window T+") + ((sat.period - world.sequence % sat.period) % sat.period) + 'm'}>{action(t("Telemetry"), 'inspect ' + sat.id)}</Row>)}
    </Panel>
    case 'osint':
    case 'archive': {
      const records = documents.filter((doc, index) => (module === 'osint' ? doc.index === 0 : visibleDocument(world, index)) && contains([doc.title, doc.id, doc.owner, doc.node, doc.body, document(doc).title, document(doc).body].join(' ')))
      return <Panel title={module === 'osint' ? t("Public dispatches") : t("Intelligence records")} detail={records.length + t(" MATCHES")}>{search(t("Search documents"))}
        {records.map(doc => <Row key={doc.id} id={doc.id} name={document(doc).title} info={doc.date + ' · ' + doc.owner + ' · ' + doc.node}>{action(t("Read"), 'open ' + doc.id)}{module === 'osint' && action(t("Inspect relay"), 'inspect ' + doc.node)}</Row>)}
        {module === 'archive' && world.events.filter(event => contains(eventReport(event) + ' ' + event.description + ' ' + eventDescription(event))).slice(0, 16).map(event => <Row key={event.id} id={eventReport(event)} name={eventDescription(event)}>{action(t("Open report"), 'open ' + eventReport(event))}</Row>)}
      </Panel>
    }
    case 'crypto': return <Panel title={t("Cipher desk")} detail={t("CIPHER CHALLENGES")}>
      {arcs.map((arc, i) => <Row key={arc.node} id={initialSignal(i)} name={world.seen.includes(initialSignal(i)) ? arc.cipher : t("Signal analysis required")} info={t("Alphabet shift · register offset +3")}>{action('Read signal', 'analyze ' + initialSignal(i))}</Row>)}
      <form className="padding actions" onSubmit={event => { event.preventDefault(); if (input.trim()) run('solve ' + input); setInput('') }}><input aria-label={t("Cipher key")} placeholder={t("Cipher key")} value={input} onChange={event => setInput(event.target.value)} maxLength={32}/><button>{t("Verify key")}</button></form>
    </Panel>
    case 'forensics': return <Panel title={t("Event chronology")} detail={world.events.length + t(" RECORDS")}>{search(t("Search event records"))}
      {world.events.filter(event => contains(event.id + ' ' + event.description + ' ' + eventDescription(event))).slice(0, 60).map(event => <Row key={event.id} id={event.id} name={eventDescription(event)} info={new Date(event.timestamp).toISOString() + ' · ' + t(event.status)}>{action(t("Trace"), 'trace ' + event.id)}{action(t("Signal"), 'analyze ' + eventSignal(event))}{action(t("Report"), 'open ' + eventReport(event))}</Row>)}
    </Panel>
    case 'shadow': return <Panel title={t("Hidden registry")} detail={world.secrets.length ? t("CARRIER ACQUIRED") : t("NO CARRIER")}>
      {world.secrets.length === 0 && <p className="padding dim">{t("Correlate a fragmented transmission with its source relay to establish contact.")}</p>}
      {arcs.map((arc, family) => world.secrets.includes(SECRET_IDS[family * 5]) && <Row key={arc.node} id={SECRET_IDS[family * 5]} name={t(arc.title)} info={world.secrets.includes(SECRET_IDS[family * 5 + 2]) ? t("Restricted ledger located") : t("Shadow contact · review the public dispatch")}>{action(t("Read dispatch"), 'open ' + documents[family * 10].id)}{world.secrets.includes(SECRET_IDS[family * 5 + 2]) && action(t("Read ledger"), 'open ' + documents[family * 10 + 6].id)}</Row>)}
    </Panel>
    case 'omega': return <Panel title={t("OMEGA interface")} detail={t("LOCAL INTELLIGENCE")}>
      <div className="omega-log" aria-live="polite">{world.omega.slice(-12).map((turn, i) => <div className="entry" key={i}><div className="dim">{world.operator} · {turn.input}</div><p><strong>OMEGA</strong> {turn.output}</p></div>)}</div>
      <form className="padding actions" onSubmit={event => { event.preventDefault(); if (input.trim()) run('ask ' + input); setInput('') }}><input aria-label={t("Message OMEGA")} placeholder={t("Ask about a clue or incident")} value={input} onChange={event => setInput(event.target.value)} maxLength={230}/><button>{t("Transmit")}</button></form>
    </Panel>
    case 'black': return <Market world={world} run={run}/>
    case 'missions': return <Panel title={t("Optional assignments")} detail={Object.values(world.missions).filter(state => state === 'active').length + t(" ACTIVE")}>
      {missions.map(mission => <Row key={mission.id} id={mission.id} name={missionTitle(mission)} info={t(world.missions[mission.id] ?? 'available') + ' · ' + t(mission.description) + ' ' + mission.objectives.join(' / ')}>{world.missions[mission.id] !== 'complete' && (world.missions[mission.id] === 'active' ? action(t("Abandon"), 'abandon ' + mission.id) : action(t("Accept"), 'accept ' + mission.id))}</Row>)}
    </Panel>
    default: return null
  }
}
