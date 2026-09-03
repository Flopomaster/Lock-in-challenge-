import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'בית', icon: '🏠', end: true },
  { to: '/workouts', label: 'אימונים', icon: '🏋️' },
  { to: '/nutrition', label: 'תזונה', icon: '🍽️' },
  { to: '/goals', label: 'יעדים', icon: '🎯' },
  { to: '/habits', label: 'הרגלים', icon: '🔥' },
]

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col pb-20">
      <header className="border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold tracking-tight text-text">
          Lock In <span className="text-accent">🔒</span>
        </h1>
      </header>

      <main className="flex-1 px-4 py-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-3xl border-t border-border bg-surface">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
                isActive ? 'text-accent' : 'text-text-dim'
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
