import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { goalEntriesRepo, goalsRepo } from '../db/repository'
import type { Goal, GoalPeriod } from '../db/types'
import { formatHebrewDate, scaleTarget } from '../lib/dates'
import { Card, ProgressBar } from './Card'
import { ConfettiBurst, vibrate } from './ConfettiBurst'
import { IconCheck, IconPlus, IconTrash } from './icons'

const CATEGORY_LABELS: Record<Goal['category'], string> = {
  workout: 'אימונים',
  nutrition: 'תזונה',
  weight: 'משקל',
  custom: 'אחר',
}

const PERIOD_LABELS: Record<GoalPeriod, string> = {
  daily: 'יומי',
  weekly: 'שבועי',
  monthly: 'חודשי',
}

export function GoalProgressCard({
  goal,
  onDelete,
  viewPeriod,
}: {
  goal: Goal
  /** Omit to hide the delete button (e.g. a read+log summary view, not the management page). */
  onDelete?: (id: number) => void
  /** Browse this recurring goal at a different granularity than its native period (e.g. show a daily goal's weekly total). */
  viewPeriod?: GoalPeriod
}) {
  const [amount, setAmount] = useState('')
  const isScaled = !!viewPeriod && goal.kind === 'recurring' && viewPeriod !== goal.period

  const progress =
    useLiveQuery(
      async () => {
        if (viewPeriod && goal.kind === 'recurring') {
          return goalEntriesRepo.progressForWindow(goal, viewPeriod)
        }
        return goalEntriesRepo.progressFor(goal)
      },
      [goal, viewPeriod],
      0,
    ) ?? 0

  const effectiveTarget =
    isScaled && goal.period ? scaleTarget(goal.targetValue, goal.period, viewPeriod!) : goal.targetValue

  const pct = (progress / effectiveTarget) * 100
  const reached = progress >= effectiveTarget

  const [burstKey, setBurstKey] = useState(0)
  const [pulsing, setPulsing] = useState(false)
  const prevReachedRef = useRef(reached)

  useEffect(() => {
    if (reached && !prevReachedRef.current) {
      setBurstKey((k) => k + 1)
      setPulsing(true)
      vibrate(45)
      const t = setTimeout(() => setPulsing(false), 700)
      prevReachedRef.current = reached
      return () => clearTimeout(t)
    }
    prevReachedRef.current = reached
  }, [reached])

  async function addAmount() {
    const value = Number(amount) || 1
    await goalEntriesRepo.add(goal.id!, value)
    if (goal.kind === 'once' && progress + value >= goal.targetValue && !goal.completedAt) {
      await goalsRepo.update(goal.id!, { completedAt: Date.now() })
    }
    setAmount('')
  }

  return (
    <Card className={`relative ${pulsing ? 'celebrate-pulse' : ''}`}>
      <ConfettiBurst burstKey={burstKey} />
      <div className="mb-1 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 font-medium">
            {goal.title}
            {reached && <IconCheck size={14} className="text-primary" />}
          </div>
          <div className="text-xs text-text-dim">
            {CATEGORY_LABELS[goal.category]}
            {goal.kind === 'recurring'
              ? ` · יעד ${PERIOD_LABELS[goal.period!]} מתאפס`
              : goal.deadline
                ? ` · עד ${formatHebrewDate(goal.deadline)}`
                : ' · חד פעמי'}
            {isScaled && ` · מוצג כ${PERIOD_LABELS[viewPeriod!]}`}
          </div>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => goal.id && onDelete(goal.id)}
            className="text-text-dim hover:text-danger"
          >
            <IconTrash size={16} />
          </button>
        )}
      </div>
      <ProgressBar value={pct} />
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-text-dim">
          <span dir="ltr" className="inline-block">
            {progress} / {effectiveTarget}
          </span>{' '}
          {goal.unit}
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1"
            className="w-14 rounded-lg border border-border bg-surface-hi px-1.5 py-1 text-center text-sm text-text"
          />
          <button
            type="button"
            onClick={addAmount}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-ink"
          >
            <IconPlus size={14} />
          </button>
          <button
            type="button"
            onClick={() => goalEntriesRepo.removeLast(goal.id!)}
            className="text-xs text-text-dim underline"
          >
            בטל אחרון
          </button>
        </div>
      </div>
    </Card>
  )
}
