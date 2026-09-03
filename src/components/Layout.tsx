import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { logout } from '../lib/session'
import { IconBowl, IconDumbbell, IconHome, IconLogout, IconTarget, LogoMark } from './icons'
import DebugOverlay from './DebugOverlay'

const NAV_ITEMS = [
  { to: '/', label: 'בית', Icon: IconHome, end: true },
  { to: '/workouts', label: 'אימונים', Icon: IconDumbbell },
  { to: '/nutrition', label: 'תזונה', Icon: IconBowl },
  { to: '/goals', label: 'יעדים', Icon: IconTarget },
]

export default function Layout() {
  const [wrapperEl, setWrapperEl] = useState<HTMLDivElement | null>(null)
  return (
    <div
      ref={setWrapperEl}
      className="mx-auto flex max-w-3xl flex-col overflow-hidden"
      style={{ height: 'var(--app-vh)' }}
    >
      <DebugOverlay wrapperEl={wrapperEl} />
      {/* TEMP: bright line pinned via plain fixed positioning, to compare against the app's own bottom nav */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'lime',
          zIndex: 99998,
          pointerEvents: 'none',
        }}
      />
      <header
        className="flex shrink-0 items-center gap-2 border-b border-border px-4 pb-3"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
      >
        <LogoMark size={32} />
        <h1 className="flex-1 text-lg font-bold tracking-tight text-text">Lock In</h1>
        <button
          type="button"
          onClick={logout}
          className="text-text-dim hover:text-danger"
          aria-label="יציאה"
        >
          <IconLogout size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <Outlet />
      </main>

      <nav
        className="flex shrink-0 border-t border-border bg-surface"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-text-dim'
              }`
            }
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
