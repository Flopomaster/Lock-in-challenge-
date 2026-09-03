import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionHeader } from '../components/Card'
import { DailyCompleteCelebration } from '../components/DailyCompleteCelebration'
import { GoalProgressCard } from '../components/GoalProgressCard'
import { IconFlame } from '../components/icons'
import { vibrate } from '../components/ConfettiBurst'
import { goalEntriesRepo, goalsRepo } from '../db/repository'
import type { GoalPeriod } from '../db/types'
import { quoteForDate } from '../data/quotes'
import { computeStreak, todayStr } from '../lib/dates'

const PERIOD_TABS: { value: GoalPeriod; label: string }[] = [
  { value: 'daily', label: 'יומי' },
  { value: 'weekly', label: 'שבועי' },
  { value: 'monthly', label: 'חודשי' },
]

export default function Dashboard() {
  const today = todayStr()
  const quote = quoteForDate(today)
  const [viewPeriod, setViewPeriod] = useState<GoalPeriod>('daily')

  const goals = useLiveQuery(() => goalsRepo.active(), [], [])
  const daily = (goals ?? []).filter((g) => g.kind === 'recurring' && g.period === 'daily')
  const recurring = (goals ?? []).filter((g) => g.kind === 'recurring')
  const once = (goals ?? []).filter((g) => g.kind === 'once')
  const hasAnyGoals = recurring.length + once.length > 0

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

  const dailyDoneToday = useLiveQuery(async () => {
    if (daily.length === 0) return 0
    const progresses = await Promise.all(daily.map((g) => goalEntriesRepo.progressFor(g)))
    return progresses.filter((p, i) => p >= daily[i].targetValue).length
  }, [daily], 0)

  const allDailyDone = daily.length > 0 && dailyDoneToday === daily.length
  const [showBigCelebration, setShowBigCelebration] = useState(false)
  const prevAllDoneRef = useRef(allDailyDone)

  useEffect(() => {
    if (allDailyDone && !prevAllDoneRef.current) {
      setShowBigCelebration(true)
      vibrate([50, 60, 50, 60, 150])
    }
    prevAllDoneRef.current = allDailyDone
  }, [allDailyDone])

  return (
    <div className="flex flex-col gap-4">
      <DailyCompleteCelebration show={showBigCelebration} onDismiss={() => setShowBigCelebration(false)} />

      <Card className="border-secondary-border bg-gradient-to-br from-surface to-surface-hi">
        <p className="text-lg font-medium text-text">{quote.text}</p>
        <p className="mt-2 text-xs text-text-dim">— {quote.author}</p>
      </Card>

      <Card className="flex flex-col items-center text-center">
        <div className="flex items-center gap-1.5 text-3xl font-bold text-primary">
          {lockInStreak === undefined ? '…' : lockInStreak === null ? '–' : lockInStreak}
          {typeof lockInStreak === 'number' && lockInStreak > 0 && <IconFlame size={24} />}
        </div>
        <div className="mt-1 text-xs text-text-dim">רצף לוק-אין (ימים)</div>
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
          <div className="flex flex-col gap-3">
            {recurring.length > 0 && (
              <div className="flex gap-2 rounded-lg bg-surface-hi p-1">
                {PERIOD_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setViewPeriod(tab.value)}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                      viewPeriod === tab.value ? 'bg-primary text-primary-ink' : 'text-text-dim'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {recurring.map((g) => (
                <GoalProgressCard key={g.id} goal={g} viewPeriod={viewPeriod} />
              ))}
            </div>
            {once.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-text-dim uppercase tracking-wide">
                  חד פעמי
                </div>
                {once.map((g) => (
                  <GoalProgressCard key={g.id} goal={g} />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
