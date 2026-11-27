import { useLocale } from './locale'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { commandNames } from '../engine/commands'
import type { World } from '../engine/world'

export interface PromptRequest { command?: string }
export interface Line { command: string; output: string }
export default function Terminal({ world, lines, run, request }: { world: World; lines: Line[]; run: (command: string) => void; request?: PromptRequest }) {
  const { t } = useLocale()
  const [input, setInput] = useState('')
  const [cursor, setCursor] = useState<number>()
  const prompt = useRef<HTMLInputElement>(null)
  const output = useRef<HTMLDivElement>(null)
  const suggestions = commandNames.filter(command => command.startsWith(input.toLowerCase()))
  useEffect(() => { if (output.current) output.current.scrollTop = output.current.scrollHeight }, [lines])
  useEffect(() => {
    if (!request) return
    if (request.command !== undefined) {
      setInput(request.command)
      setCursor(undefined)
    }
    prompt.current?.focus()
    prompt.current?.scrollIntoView({ block: 'nearest' })
  }, [request])
  function submit(event: FormEvent) {
    event.preventDefault()
    if (input.trim()) run(input)
    setInput('')
    setCursor(undefined)
  }
  function keyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Tab' && input && !input.includes(' ') && suggestions.length && input !== suggestions[0]) {
      event.preventDefault()
      setInput(suggestions[0] + ' ')
    }
    if (['ArrowUp', 'ArrowDown'].includes(event.key) && world.history.length) {
      event.preventDefault()
      const index = Math.min(world.history.length, Math.max(0, (cursor ?? world.history.length) + (event.key === 'ArrowUp' ? -1 : 1)))
      setInput(world.history[index] ?? '')
      setCursor(index)
    }
  }
  return <section className="panel terminal" aria-label={t("Operator terminal")}>
    <header className="panel-head"><h2><span className="symbol">›_</span> {t("OPERATOR TERMINAL")}</h2><span className="dim">{t("LOCAL SESSION")}</span></header>
    <div className="terminal-log" ref={output} role="log" aria-label={t("Terminal output")}>
      {lines.length === 0 && <div className="dim">{t("EHX kernel ready. Enter help for commands.")}</div>}
      {lines.map((line, i) => <div className="entry" key={i}><div className="command">operator@ehx:~$ {line.command}</div><pre>{line.output}</pre></div>)}
    </div>
    <form className="prompt" onSubmit={submit}><label htmlFor="command">operator@ehx:~$</label><input ref={prompt} id="command" autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder={t("Enter command…")} value={input} onChange={event => { setInput(event.target.value); setCursor(undefined) }} onKeyDown={keyboard} maxLength={240}/><button type="submit">{t("RUN")}</button></form>
    <footer className="terminal-tools">{['help', ...new Set(world.favorites.filter(command => command !== 'help'))].slice(0, 9).map(command => <button key={command} onClick={() => run(command)}>{command}</button>)}
      {input && !input.includes(' ') && suggestions.length > 0 && <small>{t("Tab to complete ")}{suggestions.slice(0, 4).join(' · ')}</small>}</footer>
  </section>
}

export function TelemetryTerminal({ world }: { world: World }) {
  const { t, eventDescription } = useLocale()
  return <section className="panel terminal telemetry-terminal" aria-label={t("Read-only telemetry terminal")}>
    <header className="panel-head"><h2><span className="symbol">≋</span> {t("TELEMETRY TERMINAL")}</h2><span className="dim">{t("READ ONLY")}</span></header>
    <div className="terminal-log">{world.events.slice(0, 5).map(event =>
      <div className="entry" key={event.id}><span className="command">{event.id}</span> <span className="dim">{eventDescription(event)}</span></div>
    )}</div>
  </section>
}
