import type { ReactNode } from 'react'
import type { Module } from '../engine/commands'

export const title: Record<Module, string> = { center: 'Command Center', system: 'System', sigint: 'Signals Intelligence', cyber: 'Network', defense: 'Cyber Defense', orbital: 'Orbital Intelligence', osint: 'Open Source Intelligence', crypto: 'Cryptographic Intelligence', forensics: 'Digital Forensics', shadow: 'Shadow Network', archive: 'Restricted Archive', omega: 'OMEGA', missions: 'Missions', settings: 'Settings', black: 'BLACK', plus: 'PLUS' }
export function Panel({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  return <section className="panel"><header className="panel-head"><h2>{title}</h2>{detail && <span className="dim">{detail}</span>}</header>{children}</section>
}
