import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Card, ProgressBar, SectionHeader } from '../components/Card'
import { goalsRepo, habitLogsRepo, habitsRepo, mealsRepo, workoutsRepo } from '../db/repository'
import { quoteForDate } from '../data/quotes'
import { computeStreak, daysAgoRange, todayStr } from '../lib/dates'

export default function Dashboard() {
  const today = todayStr()
  const quote = quoteForDate(today)

  const habits = useLiveQuery(() => habitsRepo.active(), [], [])
  const allLogs = useLiveQuery(() => habitLogsRepo.byDate(today), [today], [])

  // Lock-In streak: consecutive days where every active habit was completed.
  const lockInStreak = useLiveQuery(async () => {
    const activeHabits = await habitsRepo.active()
    if (activeHabits.length === 0) return null
    const logsByHabit = await Promise.all(activeHabits.map((h) => habitLogsRepo.byHabit(h.id!)))
    const dateCounts = new Map<string, number>()
    logsByHabit.flat().forEach((log) => {
      if (log.completed) dateCounts.set(log.date, (dateCounts.get(log.date) ?? 0) + 1)
    })
    const fullyDoneDates = new Set(
      [...dateCounts.entries()]
        .filter(([, count]) => count >= activeHabits.length)
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

  const activeGoals = useLiveQuery(() => goalsRepo.active(), [], [])
  const habitsDoneToday = (allLogs ?? []).filter((l) => l.completed).length

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-accent-border bg-gradient-to-br from-surface to-surface-hi">
        <p className="text-lg font-medium text-text">{quote}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <div className="text-3xl font-bold text-accent">
            {lockInStreak === undefined ? '…' : lockInStreak === null ? '–' : `🔥 ${lockInStreak}`}
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
          <div className="flex items-center justify-between">
            <span className="text-text-dim">הרגלים שהושלמו</span>
            <span className="font-medium">
              {habitsDoneToday} / {(habits ?? []).length}
            </span>
          </div>
        </div>
      </Card>

      {(activeGoals ?? []).length > 0 && (
        <Card>
          <SectionHeader
            title="יעדים פעילים"
            action={
              <Link to="/goals" className="text-xs text-accent">
                לכל היעדים
              </Link>
            }
          />
          <div className="flex flex-col gap-3">
            {(activeGoals ?? []).slice(0, 3).map((g) => (
              <div key={g.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{g.title}</span>
                  <span className="text-text-dim">
                    {g.currentValue}/{g.targetValue} {g.unit}
                  </span>
                </div>
                <ProgressBar value={(g.currentValue / g.targetValue) * 100} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/workouts"
          className="rounded-2xl border border-border bg-surface p-4 text-center text-sm font-medium hover:border-accent-border"
        >
          + רישום אימון
        </Link>
        <Link
          to="/nutrition"
          className="rounded-2xl border border-border bg-surface p-4 text-center text-sm font-medium hover:border-accent-border"
        >
          + רישום ארוחה
        </Link>
      </div>
    </div>
  )
}
