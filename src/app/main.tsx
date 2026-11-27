import { english, spanish, type Locale } from '../i18n/locale'
import { LocaleContext } from './locale'
import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createRoot } from 'react-dom/client'
import { catchUp, createWorld, advance, type World } from '../engine/world'
import { execute, modules, type Module } from '../engine/commands'
import { loadSnapshot, parseSave, saveWorld } from '../database/save'
import { sound } from '../audio/sound'
import Terminal, { TelemetryTerminal, type Line, type PromptRequest } from './Terminal'
import { Center } from './Center'
import { title } from './ui'
import { readPreferences, type Preferences } from './preferences'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-600.css'
import '../styles/main.css'

const Department = lazy(() => import('./modules'))
const Plus = lazy(() => import('./Plus'))
const Settings = lazy(() => import('./Settings'))
const icons = ['▤', '⛭', '≋', '⌘', '◇', '⊙', '⌕', '▦', '◫', '◈', '▧', 'Ω', '◎', '⊞', '◬', '+']
const bootSteps = ['Kernel initialized', 'Local memory synchronized', 'Network established', 'Operator identity generated', 'Intelligence modules loaded', 'Restricted archives indexed', 'Shadow protocol initialized']
const fresh = () => createWorld(crypto.getRandomValues(new Uint32Array(1))[0], Date.now())

function Boot({ operator, speed, finish, locale }: { operator: string; speed: number; finish: () => void; locale: Locale }) {
  const { t } = locale
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (step >= bootSteps.length) return
    const timer = window.setTimeout(() => setStep(step + 1), 700 - speed * 5)
    return () => window.clearTimeout(timer)
  }, [speed, step])
  return <div className="boot"><section className="panel boot-window"><div className="brand"><img src="./icons/ehx.svg" alt=""/><strong>EHX</strong></div><h1>{t("System initialization")}</h1><div className="boot-progress" style={{ '--progress': step / bootSteps.length } as CSSProperties}/>
    <div className="boot-log">{bootSteps.slice(0, step).map(line => <p key={line}><b>[OK]</b> {t(line)}</p>)}</div>
    {step === bootSteps.length && <p>{t("OPERATOR IDENTIFIED / ")}{operator}</p>}
    <button onClick={finish}>{step === bootSteps.length ? t("Enter command center") : t("Skip initialization")}</button>
  </section></div>
}

function App() {
  const [world, setWorld] = useState<World>()
  const current = useRef<World | undefined>(undefined)
  const [prefs, setPrefs] = useState(readPreferences)
  const locale = prefs.language === 'es' ? spanish : english
  const { t } = locale
  const [page, setPage] = useState<Module>('center')
  const [lines, setLines] = useState<Line[]>([])
  const [now, setNow] = useState(Date.now)
  const [notice, setNotice] = useState('')
  const [showNav, setShowNav] = useState(false)
  const [updateReady, setUpdateReady] = useState<ServiceWorker>()
  const [terminalRequest, setTerminalRequest] = useState<PromptRequest>()
  const enabledAudio = useRef(false)
  const saveProblem = useRef(false)
  const replacing = useRef(false)
  const revision = useRef(0)
  const persistence = useRef<Promise<void>>(Promise.resolve())

  function store(next: World, replaceExisting = false) {
    const updated = { ...next, savedAt: Date.now() }
    const pending = persistence.current.then(async () => {
      revision.current = await saveWorld(updated, replaceExisting ? undefined : revision.current)
    })
    persistence.current = pending.catch(error => {
      setNotice(error instanceof Error ? error.message : 'Local save failed. Export your universe from Settings.')
    })
    return pending
  }
  function apply(next: World) { current.current = next; setWorld(next) }
  function commit(next: World) { apply(next); if (!saveProblem.current) void store(next).catch(() => undefined) }
  useEffect(() => {
    let live = true
    void loadSnapshot().then(saved => {
      if (!live) return
      revision.current = saved.revision
      if (saved.world) commit(catchUp(saved.world, Date.now()))
      else commit(fresh())
    }).catch(() => {
      if (!live) return
      saveProblem.current = true
      setNotice('Saved data could not be loaded. Export this session or replace the save from Settings.')
      apply(fresh())
    })
    const flush = () => {
      if (document.visibilityState === 'hidden' && current.current && !saveProblem.current && !replacing.current) void store(current.current).catch(() => undefined)
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => { live = false; document.removeEventListener('visibilitychange', flush); window.removeEventListener('pagehide', flush) }
  }, [])
  useEffect(() => { document.documentElement.lang = prefs.language }, [prefs.language])
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    let registration: ServiceWorkerRegistration | undefined
    let observed: ServiceWorker | null = null
    let live = true
    let reloading = false
    const check = () => {
      if (!live) return
      if (registration?.waiting && navigator.serviceWorker.controller) setUpdateReady(registration.waiting)
    }
    const watch = () => { observed?.removeEventListener('statechange', check); observed = registration?.installing ?? null; observed?.addEventListener('statechange', check) }
    const reload = () => { if (reloading) return; reloading = true; if (sessionStorage.getItem('ehx.update') === 'yes') { sessionStorage.removeItem('ehx.update'); location.reload() } }
    navigator.serviceWorker.addEventListener('controllerchange', reload)
    void navigator.serviceWorker.register('./sw.js').then(result => {
      if (!live) return
      registration = result
      registration.addEventListener('updatefound', watch)
      watch()
      check()
    }).catch(() => setNotice('Offline installation could not be initialized.'))
    return () => { live = false; observed?.removeEventListener('statechange', check); registration?.removeEventListener('updatefound', watch); navigator.serviceWorker.removeEventListener('controllerchange', reload) }
  }, [])
  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden) setNow(Date.now()) }, prefs.mode === 'quiet' ? 5000 : 1000)
    return () => window.clearInterval(timer)
  }, [prefs.mode])
  useEffect(() => {
    if (!world?.started) return
    const timer = window.setInterval(() => {
      const before = current.current
      if (!before || replacing.current || document.hidden) return
      const next = advance(before, Date.now())
      if (next === before) return
      commit(next)
      const event = next.events[0]
      if (prefs.mode === 'cinematic') setLines(previous => [...previous, { command: 'trace ' + event.id, output: locale.eventDescription(event) }].slice(-40))
      if (enabledAudio.current && !prefs.muted && prefs.mode !== 'quiet') {
        if (event.status === 'open') sound('alert', prefs.volume * prefs.alerts / 10000)
        else if (prefs.mode === 'cinematic' || prefs.mode === 'autonomous') sound('ambient', prefs.volume * prefs.ambient / 10000)
      }
    }, prefs.cadence * (prefs.mode === 'quiet' ? 3000 : prefs.mode === 'cinematic' ? 500 : 1000))
    return () => window.clearInterval(timer)
  }, [world?.started, prefs, locale])

  function setPreferences(next: Preferences) {
    const before = prefs.mode
    setPrefs(next)
    try { localStorage.setItem('ehx.preferences', JSON.stringify(next)) }
    catch { setNotice('Display preferences could not be saved.') }
    if (!next.muted) {
      enabledAudio.current = true
      if (prefs.muted) sound('boot', next.volume / 100)
    }
    if (next.mode === 'cinematic' && before !== 'cinematic') {
      navigate('center')
      void document.documentElement.requestFullscreen?.().catch(() => undefined)
    }
    if (before === 'cinematic' && next.mode !== 'cinematic' && document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
  }
  useEffect(() => {
    if (prefs.mode !== 'cinematic') return
    const leave = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') setPreferences({ ...prefs, mode: 'operator' }) }
    window.addEventListener('keydown', leave)
    return () => window.removeEventListener('keydown', leave)
  })

  function navigate(next: Module) { setPage(next); setShowNav(false) }
  function run(command: string) {
    if (!current.current || replacing.current) return
    enabledAudio.current = true
    if (!prefs.muted && prefs.mode !== 'quiet') sound(command.startsWith('ask ') ? 'omega' : 'terminal', prefs.volume * prefs.terminal / 10000)
    const before = current.current
    const reply = execute(before, command, locale)
    const showReply = () => {
      if (reply.clear) setLines([])
      else if (reply.text) setLines(previous => [...previous, { command, output: reply.text }].slice(-45))
      if (reply.view) navigate(reply.view)
    }
    if (reply.world.market !== before.market && !saveProblem.current) {
      replacing.current = true
      void store(reply.world).then(() => {
        apply(reply.world)
        showReply()
      }).catch(() => undefined).finally(() => { replacing.current = false })
      return
    }
    commit(reply.world)
    showReply()
  }
  function buttonRun(command: string) {
    run(command)
    if (['inspect', 'trace', 'analyze', 'open', 'solve'].includes(command.split(' ')[0])) setTerminalRequest({})
  }

  async function replace(next: World) {
    replacing.current = true
    try {
      await store(next, true)
      saveProblem.current = false
      apply(next)
      setLines([])
      setNotice('')
    } finally { replacing.current = false }
  }
  async function importSave(file: File) {
    if (file.size > 2_000_000) throw new Error('Save exceeds 2 MB.')
    const contents = await file.text()
    let data: unknown
    try { data = JSON.parse(contents) } catch { throw new Error('Invalid JSON file.') }
    const imported = parseSave(data)
    await replace(imported)
  }
  function exportSave() {
    if (!current.current) return
    const url = URL.createObjectURL(new Blob([JSON.stringify(current.current, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = current.current.operator + '.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  function finishBoot() {
    if (!current.current) return
    enabledAudio.current = true
    if (!prefs.muted) sound('boot', prefs.volume / 100)
    commit({ ...current.current, started: true })
  }
  if (!world) return <main className="boot">{t("Initializing local memory…")}</main>
  if (!world.started) return <Boot operator={world.operator} speed={prefs.typing} finish={finishBoot} locale={locale}/>

  return <LocaleContext.Provider value={locale}><div className={['shell', 'mode-' + prefs.mode, prefs.crt ? 'crt' : '', prefs.motion === 0 ? 'still' : '', prefs.density].join(' ')} style={{ '--scale': prefs.scale / 100, '--motion': prefs.motion / 100 } as CSSProperties}>
    <div className="topbar">
      <button className="brand" onClick={() => navigate('center')} aria-label={t("EHX Command Center")}><img src="./icons/ehx.svg" alt=""/><strong>EHX</strong><span>ENJOY HACKER XPERIENCE</span></button>
      <div className="top-meta"><time>{new Date(now).toISOString().slice(11, 19)} UTC</time><span className="online"><i/> {t("LOCAL")}</span>{prefs.mode === "cinematic" && <button onClick={() => navigate("settings")}>{t("Settings")}</button>}</div>
    </div>
    <div className="workspace">
      <aside className={'sidebar ' + (showNav ? 'expanded' : '')}>
        <button className="nav-toggle" aria-expanded={showNav} onClick={() => setShowNav(!showNav)}>{t("Departments")}</button>
        <div className="nav-content">
          <div className="identity"><span>{t("OPERATOR ID")}</span><strong>{world.operator}</strong><small>{t("ANONYMOUS SESSION")}</small></div>
          <nav aria-label={t("Departments")}><div className="nav-label">{t("DEPARTMENTS")}</div>{modules.map((module, i) => <button key={module} aria-current={page === module ? 'page' : undefined} className={page === module ? 'selected' : ''} onClick={() => navigate(module)}><span aria-hidden="true">{icons[i]}</span>{module === 'center' ? t('Command Center') : t(module.toUpperCase())}</button>)}</nav>
        </div>
      </aside>
      <main id="main" className="main">
        <div className="page-heading"><div><div className="eyebrow"><i/> {t("EHX OPERATIONS CONSOLE")}</div><h1>{t(title[page])}</h1></div>
        </div>
        {notice && <div className="notice" role="status">{t(notice)}</div>}
        {updateReady && <div className="notice">{t("Console update ready.")} <button onClick={() => { sessionStorage.setItem('ehx.update', 'yes'); updateReady.postMessage('ACTIVATE') }}>{t("Apply update")}</button></div>}
        {page === 'center' ? <Center world={world} now={now} run={buttonRun}/> : <Suspense fallback={<p>{t("Loading department…")}</p>}>
          {page === 'plus' ? <Plus world={world} prepare={command => setTerminalRequest({ command })}/> : page === 'settings' ? <Settings prefs={prefs} update={setPreferences} exportSave={exportSave} importSave={importSave} reset={() => replace(fresh())}/> : <Department key={page} module={page} world={world} run={buttonRun}/>}
        </Suspense>}
        <div className={page === 'center' ? 'terminal-grid' : page === 'plus' ? 'plus-terminal' : undefined}><Terminal world={world} lines={lines} run={run} request={terminalRequest}/>{page === 'center' && <TelemetryTerminal world={world}/>}</div>
        <footer className="app-footer"><span>{t("EHX // OPERATIONS")}</span><span>{t("MODE: ")}{t(prefs.mode).toUpperCase()}</span></footer>
      </main>
    </div>
  </div></LocaleContext.Provider>
}
createRoot(document.getElementById('root')!).render(<App/>)
