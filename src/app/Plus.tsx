import descriptions from '../i18n/commands.en.json'
import { useState } from 'react'
import { commandGroups, examples, operatorRoute } from '../content/plus'
import { arcs, documents } from '../content/catalog'
import { commandNames } from '../engine/commands'
import type { World } from '../engine/world'
import { useLocale } from './locale'
import { Panel } from './ui'

export default function Plus({ world, prepare }: { world: World; prepare: (command: string) => void }) {
  const { t, language } = useLocale()
  const [filter, setFilter] = useState('')
  const query = filter.trim()
  const normalized = (value: string) => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  const witnessNode = arcs.find((_, family) => world.seen.includes(documents[family * 10 + 9].id))?.node
  const groups = Object.entries(commandGroups).map(([category, names]) => ({
    category,
    commands: names.flatMap(name => {
      if (name === 'witness' ? !witnessNode : !commandNames.includes(name)) return []
      const example = name === 'witness' ? 'witness ' + witnessNode : examples[name] ?? name
      const description = language === 'es' ? t('command.' + name) : descriptions[name]
      return normalized(example + ' ' + description).includes(normalized(query)) ? [{ example, description }] : []
    }),
  })).filter(group => group.commands.length)
  const commandButton = (command: string) => <button type="button" className="plus-command" key={command} onClick={() => prepare(command)}><code>{command}</code></button>
  return <div className="plus-guide">
    <Panel title={t('Operator route')}>
      <p className="padding dim">{t('Follow the commands in order. Select one to load it into the terminal, then press Enter to run it.')}</p>
      <ol className="plus-route">
        {operatorRoute.map(stage => <li key={stage.title}>
          <h3>{t(stage.title)}</h3>
          <p>{t(stage.instructions)}</p>
          <div className="actions">{(stage.choices ?? stage.commands).map(commandButton)}</div>
          {stage.hint && <details><summary>{t('Reveal cipher answer')}</summary><p>{t(stage.hint)}</p>{commandButton('solve EMBER')}</details>}
        </li>)}
      </ol>
    </Panel>
    <Panel title={t('Command reference')}>
      <input className="search" type="search" aria-label={t('Search commands')} placeholder={t('Search commands')} value={filter} onChange={event => setFilter(event.target.value)}/>
      {groups.length === 0 && <p className="padding dim">{t('No matching commands.')}</p>}
      {groups.map(({ category, commands }) => <section key={category} className="plus-category">
        <h3>{t(category)}</h3>
        <ul>{commands.map(({ example, description }) => <li key={example}>{commandButton(example)} <span>{description}</span></li>)}</ul>
      </section>)}
    </Panel>
  </div>
}
