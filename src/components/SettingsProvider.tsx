import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { SettingsContext, loadSettings, storeSettings, type Settings } from '../lib/settings'

export default function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    storeSettings(settings)
    const root = document.documentElement
    root.lang = settings.lang
    root.dir = settings.lang === 'he' ? 'rtl' : 'ltr'
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.dataset.theme = settings.theme
  }, [settings])

  const value = useMemo(
    () => ({ ...settings, update: (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })) }),
    [settings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
