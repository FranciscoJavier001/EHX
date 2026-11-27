import { useLocale } from './locale'
import { useState } from 'react'
import { Panel } from './ui'
import { modes, type Preferences } from './preferences'

export default function Settings({ prefs, update, exportSave, importSave, reset }: {
  prefs: Preferences; update: (next: Preferences) => void; exportSave: () => void
  importSave: (file: File) => Promise<void>; reset: () => Promise<void>
}) {
  const { t } = useLocale()
  const [confirm, setConfirm] = useState('')
  const [feedback, setFeedback] = useState('')
  const [pending, setPending] = useState(false)
  const range = (key: 'volume' | 'ambient' | 'terminal' | 'alerts' | 'motion' | 'scale' | 'cadence' | 'typing', label: string, min = 0, max = 100) =>
    <label className="field">{label}<input type="range" min={min} max={max} value={prefs[key]} onChange={event => update({ ...prefs, [key]: Number(event.target.value) })}/><output>{prefs[key]}</output></label>
  async function perform(operation: () => Promise<void>, success: string) {
    setPending(true)
    try { await operation(); setFeedback(success) }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Operation failed.") }
    finally { setPending(false) }
  }
  return <Panel title={t("Console configuration")} detail={t("ON-DEVICE")}>
    <div className="settings-grid padding">
      <div><h3>{t("Display & activity")}</h3>
        <label className="field">{t("Experience mode")}<select value={prefs.mode} onChange={event => update({ ...prefs, mode: event.target.value })}>{modes.map(mode => <option key={mode} value={mode}>{t(mode)}</option>)}</select></label>
        <label className="field">{t("Language")}<select value={prefs.language} onChange={event => update({ ...prefs, language: event.target.value === "es" ? "es" : "en" })}><option value="en">English</option><option value="es">Español</option></select></label>
        <label className="field">{t("Density")}<select value={prefs.density} onChange={event => update({ ...prefs, density: event.target.value })}><option value="standard">{t("standard")}</option><option value="compact">{t("compact")}</option></select></label>
        <label className="field">{t("CRT scanlines")}<input type="checkbox" checked={prefs.crt} onChange={event => update({ ...prefs, crt: event.target.checked })}/></label>
        {range('motion',t("Motion intensity"))}{range('scale',t("Text scale (%)"),90,125)}{range('typing',t("Boot typing speed"))}{range('cadence',t("Event interval (seconds)"),5,100)}
      </div>
      <div><h3>{t("Audio")}</h3><label className="field">{t("Mute audio")}<input type="checkbox" checked={prefs.muted} onChange={event => update({ ...prefs, muted: event.target.checked })}/></label>
        {range('volume',t("Master volume"))}{range('ambient',t("Ambience"))}{range('terminal',t("Terminal"))}{range('alerts',t("Alerts"))}
      </div>
    </div>
    <div className="padding save-tools"><h3>{t("Universe save")}</h3><div className="actions"><button onClick={exportSave}>{t("Export JSON")}</button></div>
      <label className="field">{t("Replace current universe with a JSON save")}<input type="file" accept="application/json,.json" disabled={pending} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void perform(() => importSave(file), "Save imported.") }}/></label>
      {confirm ? <div className="actions"><input aria-label={t("Type RESET")} placeholder={t("Type RESET")} value={confirm.trimStart()} onChange={event => setConfirm(event.target.value || ' ')}/><button disabled={confirm !== 'RESET' || pending} onClick={() => void perform(async () => { await reset(); setConfirm('') }, "New universe initialized.")}>{t("Confirm reset")}</button><button onClick={() => setConfirm('')}>{t("Cancel")}</button></div> : <button onClick={() => setConfirm(' ')}>{t("Reset universe")}</button>}
      <p role="status">{t(feedback)}</p>
    </div>
  </Panel>
}
