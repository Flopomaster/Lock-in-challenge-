import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, ProgressBar, SectionHeader } from '../components/Card'
import { bodyMetricsRepo, goalsRepo } from '../db/repository'
import type { GoalCategory } from '../db/types'
import { formatHebrewDate, todayStr } from '../lib/dates'

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  workout: 'אימונים',
  nutrition: 'תזונה',
  weight: 'משקל',
  custom: 'אחר',
}

export default function Goals() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GoalCategory>('workout')
  const [targetValue, setTargetValue] = useState('')
  const [unit, setUnit] = useState('')
  const [deadline, setDeadline] = useState('')

  const [weightDate, setWeightDate] = useState(todayStr())
  const [weightVal, setWeightVal] = useState('')

  const goals = useLiveQuery(() => goalsRepo.all(), [], [])
  const metrics = useLiveQuery(() => bodyMetricsRepo.all(), [], [])

  async function handleAddGoal() {
    if (!title.trim() || !targetValue) return
    await goalsRepo.add({
      title: title.trim(),
      category,
      targetValue: Number(targetValue),
      currentValue: 0,
      unit: unit.trim() || 'יח׳',
      deadline: deadline || undefined,
    })
    setTitle('')
    setTargetValue('')
    setUnit('')
    setDeadline('')
  }

  async function bump(id: number, current: number, target: number, delta: number) {
    const next = Math.max(0, current + delta)
    await goalsRepo.update(id, {
      currentValue: next,
      completedAt: next >= target ? Date.now() : undefined,
    })
  }

  async function addWeight() {
    if (!weightVal) return
    await bodyMetricsRepo.add({ date: weightDate, weightKg: Number(weightVal) })
    setWeightVal('')
  }

  const chartData = (metrics ?? []).map((m) => ({
    date: formatHebrewDate(m.date),
    weight: m.weightKg,
  }))

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader title="יעד חדש" />
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="לדוגמה: 12 אימונים החודש"
            className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
          />
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
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
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
              placeholder="יחידה (ק״ג, אימונים...)"
              className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
          </div>
          <button
            type="button"
            onClick={handleAddGoal}
            className="rounded-lg bg-accent py-2 text-sm font-semibold text-white"
          >
            הוסף יעד
          </button>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {(goals ?? []).length === 0 && <p className="text-sm text-text-dim">אין יעדים עדיין.</p>}
        {(goals ?? []).map((g) => (
          <Card key={g.id}>
            <div className="mb-1 flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {g.title} {g.completedAt && '✅'}
                </div>
                <div className="text-xs text-text-dim">
                  {CATEGORY_LABELS[g.category]}
                  {g.deadline ? ` · עד ${formatHebrewDate(g.deadline)}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => g.id && goalsRepo.remove(g.id)}
                className="text-xs text-text-dim hover:text-accent"
              >
                מחק
              </button>
            </div>
            <ProgressBar value={(g.currentValue / g.targetValue) * 100} />
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-text-dim">
                {g.currentValue} / {g.targetValue} {g.unit}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => g.id && bump(g.id, g.currentValue, g.targetValue, -1)}
                  className="h-7 w-7 rounded-lg border border-border text-text-dim"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => g.id && bump(g.id, g.currentValue, g.targetValue, 1)}
                  className="h-7 w-7 rounded-lg border border-border text-text-dim"
                >
                  +
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeader title="מעקב משקל" />
        {chartData.length > 1 && (
          <div className="mb-3 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="date" stroke="#9a98a6" fontSize={11} />
                <YAxis stroke="#9a98a6" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ background: '#1c1f29', border: '1px solid #2a2d3a' }}
                  labelStyle={{ color: '#e7e6ea' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#ff5e3a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="date"
            value={weightDate}
            onChange={(e) => setWeightDate(e.target.value)}
            className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
          />
          <input
            type="number"
            value={weightVal}
            onChange={(e) => setWeightVal(e.target.value)}
            placeholder='משקל (ק"ג)'
            className="flex-1 rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
          />
          <button
            type="button"
            onClick={addWeight}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white"
          >
            הוסף
          </button>
        </div>
      </Card>
    </div>
  )
}
