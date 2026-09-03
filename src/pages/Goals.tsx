import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, SectionHeader } from '../components/Card'
import { GoalProgressCard } from '../components/GoalProgressCard'
import { goalsRepo } from '../db/repository'
import type { GoalCategory, GoalKind, GoalPeriod } from '../db/types'

const CATEGORY_LABELS: Record<GoalCategory, string> = {
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

export default function Goals() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GoalCategory>('workout')
  const [kind, setKind] = useState<GoalKind>('recurring')
  const [period, setPeriod] = useState<GoalPeriod>('daily')
  const [targetValue, setTargetValue] = useState('')
  const [unit, setUnit] = useState('')
  const [deadline, setDeadline] = useState('')

  const goals = useLiveQuery(() => goalsRepo.all(), [], [])
  const activeGoals = (goals ?? []).filter((g) => !g.completedAt)
  const completedGoals = (goals ?? []).filter((g) => g.completedAt)

  async function handleAddGoal() {
    if (!title.trim() || !targetValue) return
    await goalsRepo.add({
      title: title.trim(),
      category,
      kind,
      period: kind === 'recurring' ? period : undefined,
      targetValue: Number(targetValue),
      unit: unit.trim() || 'יח׳',
      deadline: kind === 'once' ? deadline || undefined : undefined,
    })
    setTitle('')
    setTargetValue('')
    setUnit('')
    setDeadline('')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader title="יעד חדש" />
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="לדוגמה: לשתות 4 ליטר מים"
            className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
          />

          <div className="flex gap-2 rounded-lg bg-surface-hi p-1">
            {(['recurring', 'once'] as GoalKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                  kind === k ? 'bg-primary text-primary-ink' : 'text-text-dim'
                }`}
              >
                {k === 'recurring' ? 'יעד קבוע (מתאפס)' : 'חד פעמי'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GoalCategory)}
              className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            >
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            {kind === 'recurring' ? (
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
                className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
              >
                {Object.entries(PERIOD_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="דדליין (אופציונלי)"
                className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="יעד (מספר)"
              className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="יחידה (ליטר, אימונים...)"
              className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
          </div>
          <button
            type="button"
            onClick={handleAddGoal}
            className="rounded-lg bg-primary py-2 text-sm font-semibold text-primary-ink"
          >
            הוסף יעד
          </button>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {activeGoals.length === 0 && <p className="text-sm text-text-dim">אין יעדים פעילים עדיין.</p>}
        {activeGoals.map((g) => (
          <GoalProgressCard key={g.id} goal={g} onDelete={(id) => goalsRepo.remove(id)} />
        ))}
      </div>

      {completedGoals.length > 0 && (
        <div>
          <SectionHeader title="הושלמו" />
          <div className="flex flex-col gap-2 opacity-70">
            {completedGoals.map((g) => (
              <GoalProgressCard key={g.id} goal={g} onDelete={(id) => goalsRepo.remove(id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
