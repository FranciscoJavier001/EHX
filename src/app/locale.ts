import { createContext, useContext } from 'react'
import { english } from '../i18n/locale'

export const LocaleContext = createContext(english)
export const useLocale = () => useContext(LocaleContext)
