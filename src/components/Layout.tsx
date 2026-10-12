import { Link, NavLink, Outlet } from 'react-router-dom'
import { useGameData } from '../data/gameData'
import { useCurrentRun, type CurrentRun } from '../db/hooks'
import { runGameName } from '../db/repository'
import type { RunContext } from '../lib/runContext'
import { useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'
import { IconBadge, IconGrave, IconHome, IconMap, IconSettings, IconSwap, IconTeam, Pokeball } from './icons'
import CatchCelebration from './CatchCelebration'
import Welcome from './Welcome'

export default function Layout() {
  const t = useT()
  const current: CurrentRun = useCurrentRun()
  const { run } = current
  const data = useGameData(run && !run.customGame ? run.gameId : undefined)
  const loading = current.loading || data === undefined

  const nav = [
    { to: '/', label: t('navHome'), Icon: IconHome, end: true },
    { to: '/routes', label: t('navRoutes'), Icon: IconMap },
    { to: '/team', label: t('navTeam'), Icon: IconTeam },
    ...(data?.bosses.length ? [{ to: '/bosses', label: t('navBosses'), Icon: IconBadge }] : []),
    { to: '/graveyard', label: t('navGraveyard'), Icon: IconGrave },
  ]

  return (
    <div className="mx-auto flex max-w-2xl flex-col overflow-hidden" style={{ height: 'var(--app-vh)' }}>
      <header
        className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-4 pb-2.5"
        style={{ paddingTop: 'calc(0.6rem + env(safe-area-inset-top, 0px))' }}
      >
        <Link to="/runs" className="flex min-w-0 flex-1 items-center gap-2.5">
          <Pokeball size={30} className="shrink-0 text-text" />
          <div className="min-w-0">
            <div className="truncate font-bold leading-tight">{run ? run.name : t('appName')}</div>
            <div className="flex items-center gap-1 truncate text-xs text-text-dim">
              {run ? runGameName(run) : t('noRunSelected')}
              <IconSwap size={12} />
            </div>
          </div>
        </Link>
        <Link to="/settings" className="rounded-full p-2 text-text-dim hover:bg-surface-hi" aria-label={t('settings')}>
          <IconSettings size={22} />
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? null : run ? <Outlet context={{ run, encounters: current.encounters, data: data ?? null } satisfies RunContext} /> : <Welcome />}
      </main>

      {run && <CatchCelebration style={spriteStyleForRun(run)} />}
      {run && (
        <nav className="flex shrink-0 border-t border-border bg-surface" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-text-dim'
                }`
              }
            >
              <Icon size={23} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
