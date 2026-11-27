import type { Language } from '../i18n/locale'

export const defaults = { language: 'en' as Language, mode: 'operator', crt: true, muted: true, volume: 55, ambient: 35, terminal: 45, alerts: 60, motion: 70, scale: 100, cadence: 20, typing: 65, density: 'standard' }
export type Preferences = typeof defaults
export const modes = ['operator', 'autonomous', 'cinematic', 'quiet']
export function readPreferences(): Preferences {
  try {
    const data = JSON.parse(localStorage.getItem('ehx.preferences') ?? '{}')
    const result = { ...defaults }
    if (data.language === 'es') result.language = 'es'
    for (const key of ['crt', 'muted'] as const) if (typeof data[key] === 'boolean') result[key] = data[key]
    for (const key of ['volume', 'ambient', 'terminal', 'alerts', 'motion', 'scale', 'cadence', 'typing'] as const) {
      const value = data[key]
      if (Number.isInteger(value)) result[key] = Math.min(key === 'scale' ? 125 : 100, Math.max(key === 'scale' ? 90 : key === 'cadence' ? 5 : 0, value))
    }
    if (modes.includes(data.mode) && data.mode !== 'cinematic') result.mode = data.mode
    if (data.density === 'compact') result.density = data.density
    return result
  } catch { return { ...defaults } }
}
