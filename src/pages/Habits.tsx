import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, SectionHeader } from '../components/Card'
import { habitLogsRepo, habitsRepo } from '../db/repository'
import { addDays, computeStreak, todayStr } from '../lib/dates'

const ICONS = ['🔥', '💪', '🥗', '🧘', '💧', '😴', '📖', '🏃']

function HabitRow({ habit }: { habit: { id: number; title: string; icon?: string } }) {
  const today = todayStr()
  const logs = useLiveQuery(() => habitLogsRepo.byHabit(habit.id), [habit.id], [])

  const doneDates = new Set((logs ?? []).filter((l) => l.completed).map((l) => l.date))
  const streak = computeStreak(doneDates)
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)))
  const doneToday = doneDates.has(today)

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{habit.icon ?? '✅'}</span>
          <div>
            <div className="font-medium">{habit.title}</div>
            <div className="text-xs text-text-dim">{streak > 0 ? `🔥 רצף ${streak} ימים` : 'התחל היום'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => habitLogsRepo.toggle(habit.id, today)}
            className={`h-9 w-9 rounded-full border text-lg ${
              doneToday
                ? 'border-accent bg-accent-bg text-accent'
                : 'border-border text-text-dim'
            }`}
          >
            {doneToday ? '✓' : ''}
          </button>
          <button
            type="button"
            onClick={() => habitsRepo.remove(habit.id)}
            className="text-xs text-text-dim hover:text-accent"
          >
            מחק
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        {last7.map((d) => (
          <div
            key={d}
            className={`h-2 flex-1 rounded-full ${
              doneDates.has(d) ? 'bg-accent' : 'bg-surface-hi'
            }`}
            title={d}
          />
        ))}
      </div>
    </Card>
  )
}

export default function Habits() {
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState(ICONS[0])

  const habits = useLiveQuery(() => habitsRepo.active(), [], [])

  async function handleAdd() {
    if (!title.trim()) return
    await habitsRepo.add({ title: title.trim(), icon })
    setTitle('')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <SectionHeader title="הרגל חדש" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`h-9 w-9 rounded-lg border text-lg ${
                  icon === ic ? 'border-accent bg-accent-bg' : 'border-border'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: לשתות 3 ליטר מים"
              className="flex-1 rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white"
            >
              הוסף
            </button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {(habits ?? []).length === 0 && (
          <p className="text-sm text-text-dim">אין הרגלים עדיין. תוסיף את הראשון.</p>
        )}
        {(habits ?? []).map((h) => (
          <HabitRow key={h.id} habit={{ id: h.id!, title: h.title, icon: h.icon }} />
        ))}
      </div>
    </div>
  )
}
