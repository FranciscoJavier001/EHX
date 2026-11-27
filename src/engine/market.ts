import { contracts, frontierId, frontierUnlocked, type ContractStatus, type MarketLedger } from '../content/market'
import type { Locale } from '../i18n/locale'

export function credits(ledger: MarketLedger) {
  return contracts.reduce((total, item) => {
    const state = ledger[item.id]
    return total + (state === 'reviewed' && item.id !== frontierId || state === 'sealed' ? item.reward : 0)
  }, 0)
}

export function validMarket(value: unknown): value is MarketLedger {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const ledger = value as MarketLedger
  for (const [id, state] of Object.entries(ledger)) {
    if (!contracts.some(item => item.id === id)) return false
    if (id === frontierId) {
      if (!frontierUnlocked(ledger) || !['accepted', 'reviewed', 'published', 'sealed'].includes(state)) return false
    } else if (state !== 'accepted' && state !== 'reviewed') return false
  }
  return true
}
export type MarketAction = 'contract' | 'review' | 'dispatch' | 'publish' | 'seal'
export function marketAction(ledger: MarketLedger, action: MarketAction, target: string, locale: Locale) {
  const item = contracts.find(contract => contract.id === target.toUpperCase())
  const unchanged = (key: string) => ({ ledger, text: locale.t(key) })
  if (!item) return unchanged('Unknown contract.')
  const isFrontier = item.id === frontierId
  const state = ledger[item.id]
  const notes = locale.language === 'es' ? item.es : item
  const change = (next: ContractStatus, text: string) => ({ ledger: { ...ledger, [item.id]: next }, text: item.id + ' · ' + text })
  if (action === 'contract' && !state && (!isFrontier || frontierUnlocked(ledger))) return change('accepted', notes.brief)
  if (action === 'review' && !isFrontier && state === 'accepted') return change('reviewed', notes.evidence)
  if (action === 'dispatch' && isFrontier && state === 'accepted') return change('reviewed', notes.evidence)
  if (isFrontier && state === 'reviewed') {
    if (action === 'publish') return change('published', locale.t('Evidence published. The sponsors froze your escrow.'))
    if (action === 'seal') return change('sealed', locale.t('Escrow released. You signed the lead author’s copy.'))
  }
  return unchanged('Action unavailable for this contract.')
}
