import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type ReactElement } from 'react'
import { Card, SectionHeader } from '../components/Card'
import {
  IconBolt,
  IconBook,
  IconBowl,
  IconCheck,
  IconDroplet,
  IconDumbbell,
  IconFlame,
  IconMoon,
  IconTrash,
  type IconProps,
} from '../components/icons'
import { habitLogsRepo, habitsRepo } from '../db/repository'
import { addDays, computeStreak, todayStr } from '../lib/dates'

const ICON_OPTIONS: { key: string; Icon: (p: IconProps) => ReactElement }[] = [
  { key: 'flame', Icon: IconFlame },
  { key: 'dumbbell', Icon: IconDumbbell },
  { key: 'bowl', Icon: IconBowl },
  { key: 'droplet', Icon: IconDroplet },
  { key: 'moon', Icon: IconMoon },
  { key: 'book', Icon: IconBook },
  { key: 'bolt', Icon: IconBolt },
]

function habitIcon(key?: string) {
  return ICON_OPTIONS.find((o) => o.key === key)?.Icon ?? IconFlame
}

function HabitRow({ habit }: { habit: { id: number; title: string; icon?: string } }) {
  const today = todayStr()
  const logs = useLiveQuery(() => habitLogsRepo.byHabit(habit.id), [habit.id], [])

  const doneDates = new Set((logs ?? []).filter((l) => l.completed).map((l) => l.date))
  const streak = computeStreak(doneDates)
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)))
  const doneToday = doneDates.has(today)
  const Icon = habitIcon(habit.icon)

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-hi text-secondary">
            <Icon size={18} />
          </div>
          <div>
            <div className="font-medium">{habit.title}</div>
            <div className="flex items-center gap-1 text-xs text-text-dim">
              {streak > 0 && <IconFlame size={12} className="text-primary" />}
              {streak > 0 ? `רצף ${streak} ימים` : 'התחל היום'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => habitLogsRepo.toggle(habit.id, today)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border ${
              doneToday
                ? 'border-primary bg-primary-bg text-primary'
                : 'border-border text-text-dim'
            }`}
          >
            {doneToday && <IconCheck size={16} />}
          </button>
          <button
            type="button"
            onClick={() => habitsRepo.remove(habit.id)}
            className="text-text-dim hover:text-danger"
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        {last7.map((d) => (
          <div
            key={d}
            className={`h-2 flex-1 rounded-full ${doneDates.has(d) ? 'bg-primary' : 'bg-surface-hi'}`}
            title={d}
          />
        ))}
      </div>
    </Card>
  )
}

export default function Habits() {
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState(ICON_OPTIONS[0].key)

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
            {ICON_OPTIONS.map(({ key, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                  icon === key ? 'border-primary bg-primary-bg text-primary' : 'border-border text-text-dim'
                }`}
              >
                <Icon size={18} />
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
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-ink"
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
