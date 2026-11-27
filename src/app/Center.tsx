import GlobalMonitor from './GlobalMonitor'
import { topologyStates } from '../engine/telemetry'
import { useLocale } from './locale'
import type { World } from '../engine/world'
import { Panel } from './ui'
import { Topology } from './visuals'

export function Activity({ world, run }: { world: World; run: (command: string) => void }) {
  const { t, eventType } = useLocale()
  return <Panel title={t("EVENT STREAM")} detail={t("LIVE")}><div className="event-stream">
    {world.events.slice(0, 8).map(event => <button className={'event ' + event.severity} key={event.id} onClick={() => run('trace ' + event.id)}>
      <time>{new Date(event.timestamp).toISOString().slice(11, 19)}</time><div><span>{eventType(event.type)}</span><small>{event.sourceEntityId} / {event.id}</small></div><b aria-label={t(event.severity)}>•</b>
    </button>)}</div></Panel>
}
export function Center({ world, now, run }: { world: World; now: number; run: (command: string) => void }) {
  const { t } = useLocale()
  const online = world.devices.filter(n => n.state === 'online').length
  const open = world.events.filter(e => e.status === 'open').length
  const integrity = Math.round(online / world.devices.length * 100)
  const stats = [
    [t("ACTIVE NODES"), online, '/ ' + world.devices.length + t(" registered"), 'nodes'],
    [t("SIGNAL CAPTURES"), world.events.length + 4, t("monitored channels"), 'signals'],
    [t("OPEN INCIDENTS"), open, t("defense queue"), 'incidents'],
    [t("SYSTEM INTEGRITY"), integrity + '%', t("nominal devices"), 'system'],
  ] as const
  const elapsed = Math.max(0, Math.floor((now - world.createdAt) / 1000))
  const uptime = [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60].map(unit => String(unit).padStart(2, '0')).join(':')
  return <>
    <div className="stats">{stats.map(([label, value, detail, command], i) => <button onClick={() => run(command)} className={'stat stat-' + i} key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></button>)}</div>
    <div className="center-grid">
      <Panel title={t("NETWORK TOPOLOGY")} detail={t("SECTORS 01–04")}><Topology world={world} onNode={id => run('inspect ' + id)}/>
        <div className="legend">{topologyStates.map(state => <span className={"topology-" + state.id} key={state.id}><i/> {t(state.label)}</span>)}</div>
      </Panel>
      <Activity world={world} run={run}/>
    </div>
    <GlobalMonitor world={world} run={run}/>
    <div className="system-strip"><span>{t("UPTIME")} <b>{uptime}</b></span><span>{t("SESSIONS")} <b>{world.sessions.length}</b></span><span>{t("DISCOVERIES")} <b>{world.secrets.length}</b></span><span>{t("STATUS")} <b>{open ? t("MONITORING") : t("STABLE")}</b></span></div>
  </>
}
