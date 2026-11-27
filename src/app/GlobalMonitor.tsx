import { networkTraffic, securityNews } from '../engine/telemetry'
import type { World } from '../engine/world'
import { useLocale } from './locale'
import { Panel } from './ui'

export default function GlobalMonitor({ world, run }: { world: World; run: (command: string) => void }) {
  const { t, language, eventDescription } = useLocale()
  const traffic = networkTraffic(world)
  const total = traffic.reduce((sum, entry) => sum + entry.gbps, 0)
  const peak = Math.max(1, ...traffic.map(entry => entry.gbps))
  const format = new Intl.NumberFormat(language)
  const headlines = securityNews(world)
  return <div className="global-monitor">
    <Panel title={t('GLOBAL NETWORK MONITOR')} detail={t('EHX INTELLIGENCE DESK')}>
      <div className="monitor-grid">
        <section className="monitor-briefing">
          <h3>{t('Cyber incident news')}</h3>
          {headlines.length ? <ul className="monitor-news">
            {headlines.map(event => <li key={event.id}>
              <button className={'event ' + event.severity} onClick={() => run('trace ' + event.id)}>
                <time>{new Date(event.timestamp).toISOString().slice(11, 16)} UTC</time>
                <div><span>{eventDescription(event)}</span><small>{event.id} · {t(event.status)}</small></div>
                <b aria-label={t(event.severity)}>•</b>
              </button>
            </li>)}
          </ul> : <p className="dim">{t('No security bulletins on file.')}</p>}
        </section>
        <section className="monitor-traffic">
          <h3>{t('Global browsing traffic')}</h3>
          <p className="traffic-total"><strong>{format.format(total)}</strong> Gbps</p>
          <ul className="traffic-regions">
            {traffic.map(({ region, gbps }, index) => <li className={'traffic-region traffic-region-' + index} key={region}>
              <div><span>{t(region)}</span><strong>{format.format(gbps)} Gbps</strong></div>
              <div className="traffic-track" aria-hidden="true"><span style={{ width: gbps / peak * 100 + '%' }}/></div>
            </li>)}
          </ul>
        </section>
      </div>
    </Panel>
  </div>
}
