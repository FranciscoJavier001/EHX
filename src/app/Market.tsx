import { contracts, frontierId, frontierUnlocked } from '../content/market'
import { credits } from '../engine/market'
import type { World } from '../engine/world'
import { useLocale } from './locale'
import { Panel } from './ui'

export default function Market({ world, run }: { world: World; run: (command: string) => void }) {
  const { t, language } = useLocale()
  const ledger = world.market
  const frontier = frontierUnlocked(ledger)
  return <Panel title={t('Escrow exchange')} detail={credits(ledger) + ' ' + t('CREDITS')}>
    {contracts.map(contract => {
      const state = ledger[contract.id]
      const isFrontier = contract.id === frontierId
      const notes = language === 'es' ? contract.es : contract
      if (isFrontier && !frontier) return <p key={contract.id} className="padding dim">{t('A sealed commission opens after both audits are reviewed.')}</p>
      const hasEvidence = state === 'reviewed' || state === 'published' || state === 'sealed'
      return <article key={contract.id} className="market-contract padding">
        <div className="market-heading">
          <div><span className="dim">{contract.id} · {notes.sector}</span><h3>{notes.title}</h3></div>
          <span>{t(state ?? 'available')} · {contract.reward} {t('CREDITS')}</span>
        </div>
        <p className="dim">{notes.sponsor}</p>
        <p>{notes.brief}</p>
        {hasEvidence && <p className="market-evidence">{notes.evidence}</p>}
        {state === 'published' && <p>{t('Evidence published. The sponsors froze your escrow.')}</p>}
        {state === 'sealed' && <p>{t('Escrow released. You signed the lead author’s copy.')}</p>}
        <div className="actions">
          {!state && <button onClick={() => run('contract ' + contract.id)}>{t('Accept commission')}</button>}
          {state === 'accepted' && <button onClick={() => run((isFrontier ? 'dispatch ' : 'review ') + contract.id)}>{t(isFrontier ? 'Execute sealed order' : 'Review audit file')}</button>}
          {isFrontier && state === 'reviewed' && <>
            <button onClick={() => run('publish ' + contract.id)}>{t('Publish evidence')}</button>
            <button onClick={() => run('seal ' + contract.id)}>{t('Seal the file and collect')}</button>
          </>}
        </div>
      </article>
    })}
  </Panel>
}
