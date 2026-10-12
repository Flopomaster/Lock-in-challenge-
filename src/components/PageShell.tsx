import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../lib/settings'
import { IconChevron } from './icons'

/** Full-screen page with a back button (runs, new run, settings). */
export default function PageShell({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const navigate = useNavigate()
  const { lang } = useSettings()
  return (
    <div className="mx-auto flex max-w-2xl flex-col overflow-hidden" style={{ height: 'var(--app-vh)' }}>
      <header
        className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-2 pb-2.5"
        style={{ paddingTop: 'calc(0.6rem + env(safe-area-inset-top, 0px))' }}
      >
        <button type="button" onClick={() => navigate(-1)} className="rounded-full p-2 text-text-dim hover:bg-surface-hi" aria-label="back">
          <IconChevron size={22} className={lang === 'he' ? '' : 'rotate-180'} />
        </button>
        <h1 className="flex-1 text-lg font-bold">{title}</h1>
        {action}
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </main>
    </div>
  )
}
