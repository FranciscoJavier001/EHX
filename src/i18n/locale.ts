import type { documents, missions } from '../content/catalog'
import type { WorldEvent } from '../engine/world'
import interfaceEs from './interface.es.json'
import contentEs from './content.es.json'
import terminalEs from './terminal.es.json'

export type Language = 'en' | 'es'
type Catalog = Record<string, string>
function lookup(language: Language, catalog: Catalog) {
  return (key: string) => language === 'es' && Object.hasOwn(catalog, key) ? catalog[key] : key
}

export function createLocale(language: Language) {
  const translate = lookup(language, interfaceEs)
  const content = lookup(language, contentEs)
  const line = lookup(language, terminalEs)
  const t = (key: string) => translate(content(key))
  const eventType = (type: string) => content(type === 'Virtual link request' ? 'Link request' : type)
  const composedTitle = (title: string) => title.split(' / ').map(content).join(' / ')
  return {
    language, t, line, content, eventType,
    eventDescription(event: WorldEvent) {
      const type = event.type + ' at '
      return event.description.startsWith(type)
        ? eventType(event.type) + content(' at ') + event.description.slice(type.length)
        : event.description
    },
    eventMessage(event: WorldEvent) {
      const suffix = ' logged on the ' + event.metadata.channel + ' channel'
      return event.metadata.message === event.type + suffix
        ? eventType(event.type) + content(' logged on the ') + content(event.metadata.channel) + content(' channel')
        : content(event.metadata.message)
    },
    consequence(value: string) {
      return content(value === 'Virtual link pending review' ? 'Link pending review' : value)
    },
    document(doc: typeof documents[number]) {
      return {
        title: composedTitle(doc.title),
        body: doc.passages.map(content).join(' ') + (doc.annotation ? content(' Console annotation: ') + doc.annotation : ''),
      }
    },
    missionTitle(mission: typeof missions[number]) {
      return composedTitle(mission.title)
    },
  }
}

export type Locale = ReturnType<typeof createLocale>
export const english = createLocale('en')
export const spanish = createLocale('es')
