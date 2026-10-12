import { createContext, useContext } from 'react'
import { STRINGS, type Lang, type StringKey } from '../i18n/strings'

export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  lang: Lang
  theme: Theme
  sound: boolean
  playerName?: string
  currentRunId?: number
}

export interface SettingsContextValue extends Settings {
  update: (patch: Partial<Settings>) => void
}

const STORAGE_KEY = 'nuzlocke-settings'

export function loadSettings(): Settings {
  const fallback: Settings = {
    lang: navigator.language?.startsWith('he') ? 'he' : 'en',
    theme: 'system',
    sound: true,
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback
  } catch {
    return fallback
  }
}

export function storeSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private mode / blocked storage: settings just won't persist.
  }
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings outside SettingsProvider')
  return ctx
}

export type TFunction = (key: StringKey, vars?: Record<string, string | number>) => string

export function translate(lang: Lang): TFunction {
  return (key, vars) => {
    let s = STRINGS[lang][key] ?? STRINGS.en[key]
    // Unicode isolates keep an English name like "Route 101" from reordering a Hebrew sentence.
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, `\u2068${v}\u2069`)
    return s
  }
}

export function useT(): TFunction {
  return translate(useSettings().lang)
}
