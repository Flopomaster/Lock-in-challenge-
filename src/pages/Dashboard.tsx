import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Card, SectionHeader } from '../components/Card'
import { GoalProgressCard } from '../components/GoalProgressCard'
import { IconFlame } from '../components/icons'
import { goalEntriesRepo, goalsRepo, mealsRepo, workoutsRepo } from '../db/repository'
import type { Goal } from '../db/types'
import { quoteForDate } from '../data/quotes'
import { computeStreak, daysAgoRange, todayStr } from '../lib/dates'

function GoalGroup({ title, goals }: { title: string; goals: Goal[] }) {
  if (goals.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-text-dim uppercase tracking-wide">{title}</div>
      {goals.map((g) => (
        <GoalProgressCard key={g.id} goal={g} />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const today = todayStr()
  const quote = quoteForDate(today)

  const goals = useLiveQuery(() => goalsRepo.active(), [], [])
  const daily = (goals ?? []).filter((g) => g.kind === 'recurring' && g.period === 'daily')
  const weekly = (goals ?? []).filter((g) => g.kind === 'recurring' && g.period === 'weekly')
  const monthly = (goals ?? []).filter((g) => g.kind === 'recurring' && g.period === 'monthly')
  const once = (goals ?? []).filter((g) => g.kind === 'once')

  // Lock-In streak: consecutive days where every daily recurring goal reached its target.
  const lockInStreak = useLiveQuery(async () => {
    const dailyGoals = (await goalsRepo.active()).filter(
      (g) => g.kind === 'recurring' && g.period === 'daily',
    )
    if (dailyGoals.length === 0) return null
    const entriesByGoal = await Promise.all(dailyGoals.map((g) => goalEntriesRepo.byGoal(g.id!)))
    const sumsByDate = new Map<string, Map<number, number>>()
    dailyGoals.forEach((g, idx) => {
      entriesByGoal[idx].forEach((e) => {
        if (!sumsByDate.has(e.date)) sumsByDate.set(e.date, new Map())
        const m = sumsByDate.get(e.date)!
        m.set(g.id!, (m.get(g.id!) ?? 0) + e.amount)
      })
    })
    const fullyDoneDates = new Set(
      [...sumsByDate.entries()]
        .filter(([, sums]) => dailyGoals.every((g) => (sums.get(g.id!) ?? 0) >= g.targetValue))
        .map(([date]) => date),
    )
    return computeStreak(fullyDoneDates)
  }, [], undefined)

  const todaysMeals = useLiveQuery(() => mealsRepo.byDate(today), [today], [])
  const todaysCalories = (todaysMeals ?? []).reduce((sum, m) => sum + m.calories, 0)

  const weekWorkouts = useLiveQuery(async () => {
    const { from, to } = daysAgoRange(7)
    return workoutsRepo.byDateRange(from, to)
  }, [], [])

  const dailyDoneToday = useLiveQuery(async () => {
    if (daily.length === 0) return 0
    const progresses = await Promise.all(daily.map((g) => goalEntriesRepo.progressFor(g)))
    return progresses.filter((p, i) => p >= daily[i].targetValue).length
  }, [daily], 0)

  const hasAnyGoals = daily.length + weekly.length + monthly.length + once.length > 0

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-secondary-border bg-gradient-to-br from-surface to-surface-hi">
        <p className="text-lg font-medium text-text">{quote.text}</p>
        <p className="mt-2 text-xs text-text-dim">— {quote.author}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-3xl font-bold text-primary">
            {lockInStreak === undefined ? '…' : lockInStreak === null ? '–' : lockInStreak}
            {typeof lockInStreak === 'number' && lockInStreak > 0 && <IconFlame size={24} />}
          </div>
          <div className="mt-1 text-xs text-text-dim">רצף לוק-אין (ימים)</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-text">{(weekWorkouts ?? []).length}</div>
          <div className="mt-1 text-xs text-text-dim">אימונים השבוע</div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="היום" />
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-dim">קלוריות</span>
            <span className="font-medium">{todaysCalories} קק"ל</span>
          </div>
          {daily.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-text-dim">יעדים יומיים הושלמו</span>
              <span dir="ltr" className="inline-block font-medium">
                {dailyDoneToday} / {daily.length}
              </span>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionHeader
          title="המשימות שלי"
          action={
            <Link to="/goals" className="text-xs text-primary">
              נהל יעדים
            </Link>
          }
        />
        {!hasAnyGoals ? (
          <p className="text-sm text-text-dim">
            עדיין אין יעדים מוגדרים.{' '}
            <Link to="/goals" className="text-primary underline">
              הגדר יעד ראשון
            </Link>{' '}
            כדי לראות כאן את המשימות שלך.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <GoalGroup title="היום" goals={daily} />
            <GoalGroup title="השבוע" goals={weekly} />
            <GoalGroup title="החודש" goals={monthly} />
            <GoalGroup title="חד פעמי" goals={once} />
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/workouts"
          className="rounded-2xl border border-border bg-surface p-4 text-center text-sm font-medium hover:border-primary-border"
        >
          + רישום אימון
        </Link>
        <Link
          to="/nutrition"
          className="rounded-2xl border border-border bg-surface p-4 text-center text-sm font-medium hover:border-primary-border"
        >
          + רישום ארוחה
        </Link>
      </div>
    </div>
  )
}
