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
import { bodyMetricsRepo, settingsRepo } from '../db/repository'
import { formatHebrewDate, todayStr } from '../lib/dates'
import { Card, ProgressBar, SectionHeader } from './Card'
import { IconScale } from './icons'

export default function BodyStatsCard() {
  const [weightInput, setWeightInput] = useState('')
  const [targetInput, setTargetInput] = useState('')
  const [editingTarget, setEditingTarget] = useState(false)

  const latest = useLiveQuery(() => bodyMetricsRepo.latest(), [], undefined)
  const metrics = useLiveQuery(() => bodyMetricsRepo.all(), [], [])
  const target = useLiveQuery(() => settingsRepo.get('targetWeightKg'), [], undefined)

  const chartData = (metrics ?? []).map((m) => ({
    date: formatHebrewDate(m.date),
    weight: m.weightKg,
  }))

  async function logWeight() {
    if (!weightInput) return
    await bodyMetricsRepo.add({ date: todayStr(), weightKg: Number(weightInput) })
    setWeightInput('')
  }

  async function saveTarget() {
    if (!targetInput) return
    await settingsRepo.set('targetWeightKg', Number(targetInput))
    setTargetInput('')
    setEditingTarget(false)
  }

  const current = latest?.weightKg
  const startWeight = metrics && metrics.length > 0 ? metrics[0].weightKg : undefined
  const progressPct =
    current !== undefined && target !== undefined && startWeight !== undefined && startWeight !== target
      ? Math.max(0, Math.min(100, ((startWeight - current) / (startWeight - target)) * 100))
      : undefined

  return (
    <Card>
      <SectionHeader
        title="נתוני גוף"
        action={<IconScale size={18} className="text-secondary" />}
      />

      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <div className="text-2xl font-bold text-text">
            {current !== undefined ? current : '–'}
            <span className="text-sm text-text-dim"> ק"ג</span>
          </div>
          <div className="mt-0.5 text-xs text-text-dim">נוכחי</div>
        </div>
        <div>
          {editingTarget || target === undefined ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="יעד"
                className="w-16 rounded-lg border border-border bg-surface-hi px-1.5 py-1 text-center text-sm text-text"
              />
              <button
                type="button"
                onClick={saveTarget}
                className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-ink"
              >
                שמור
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingTarget(true)
                setTargetInput(String(target))
              }}
              className="text-2xl font-bold text-secondary"
            >
              {target}
              <span className="text-sm text-text-dim"> ק"ג</span>
            </button>
          )}
          <div className="mt-0.5 text-xs text-text-dim">יעד (לחץ לעריכה)</div>
        </div>
      </div>

      {progressPct !== undefined && (
        <div className="mt-3">
          <ProgressBar value={progressPct} />
          <div className="mt-1 text-center text-xs text-text-dim">
            {Math.round(progressPct)}% מהדרך ליעד
          </div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="mt-4 h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-text-dim)" fontSize={11} />
              <YAxis
                stroke="var(--color-text-dim)"
                fontSize={11}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface-hi)', border: '1px solid var(--color-border)' }}
                labelStyle={{ color: 'var(--color-text)' }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="var(--color-secondary)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          type="number"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          placeholder='משקל היום (ק"ג)'
          className="flex-1 rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
        />
        <button
          type="button"
          onClick={logWeight}
          className="rounded-lg bg-secondary px-4 py-1.5 text-sm font-semibold text-white"
        >
          עדכן
        </button>
      </div>
    </Card>
  )
}
