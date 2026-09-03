import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, SectionHeader } from '../components/Card'
import { IconTrash } from '../components/icons'
import { workoutsRepo } from '../db/repository'
import type { WorkoutExercise } from '../db/types'
import { formatHebrewDate, todayStr } from '../lib/dates'

function emptyExercise(): WorkoutExercise {
  return { name: '', sets: [{ reps: 0, weight: 0 }] }
}

export default function Workouts() {
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(todayStr())
  const [name, setName] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([emptyExercise()])

  const workouts = useLiveQuery(() => workoutsRepo.all(), [], [])

  function updateExercise(i: number, patch: Partial<WorkoutExercise>) {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  }

  function updateSet(exIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) {
    setExercises((prev) =>
      prev.map((e, idx) =>
        idx !== exIdx
          ? e
          : { ...e, sets: e.sets.map((s, si) => (si === setIdx ? { ...s, [field]: value } : s)) },
      ),
    )
  }

  function addSet(exIdx: number) {
    setExercises((prev) =>
      prev.map((e, idx) => (idx !== exIdx ? e : { ...e, sets: [...e.sets, { reps: 0, weight: 0 }] })),
    )
  }

  function removeExercise(i: number) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i))
  }

  function resetForm() {
    setDate(todayStr())
    setName('')
    setDurationMin('')
    setExercises([emptyExercise()])
    setShowForm(false)
  }

  async function handleSubmit() {
    if (!name.trim()) return
    await workoutsRepo.add({
      date,
      name: name.trim(),
      durationMin: durationMin ? Number(durationMin) : undefined,
      exercises: exercises.filter((e) => e.name.trim()),
    })
    resetForm()
  }

  return (
    <div className="flex flex-col gap-4">
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-primary"
        >
          + רישום אימון חדש
        </button>
      )}

      {showForm && (
        <Card>
          <SectionHeader title="אימון חדש" />
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-text-dim">
                תאריך
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-text"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-text-dim">
                שם האימון
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="רגליים, פלג גוף עליון..."
                  className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-text"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs text-text-dim">
              משך (דקות)
              <input
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="w-32 rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-text"
              />
            </label>

            <div className="flex flex-col gap-3">
              {exercises.map((ex, i) => (
                <div key={i} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => updateExercise(i, { name: e.target.value })}
                      placeholder="שם התרגיל"
                      className="flex-1 rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
                    />
                    <button
                      type="button"
                      onClick={() => removeExercise(i)}
                      className="text-xs text-text-dim"
                    >
                      הסר
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {ex.sets.map((s, si) => (
                      <div key={si} className="flex items-center gap-2 text-sm">
                        <span className="w-10 text-text-dim">סט {si + 1}</span>
                        <input
                          type="number"
                          value={s.reps || ''}
                          onChange={(e) => updateSet(i, si, 'reps', Number(e.target.value))}
                          placeholder="חזרות"
                          className="w-20 rounded-lg border border-border bg-surface-hi px-2 py-1 text-text"
                        />
                        <input
                          type="number"
                          value={s.weight || ''}
                          onChange={(e) => updateSet(i, si, 'weight', Number(e.target.value))}
                          placeholder='ק"ג'
                          className="w-20 rounded-lg border border-border bg-surface-hi px-2 py-1 text-text"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSet(i)}
                      className="mt-1 self-start text-xs text-primary"
                    >
                      + סט
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setExercises((prev) => [...prev, emptyExercise()])}
                className="rounded-lg border border-dashed border-border py-2 text-xs text-text-dim"
              >
                + תרגיל
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-ink"
              >
                שמור אימון
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-dim"
              >
                ביטול
              </button>
            </div>
          </div>
        </Card>
      )}

      <div>
        <SectionHeader title="היסטוריה" />
        <div className="flex flex-col gap-2">
          {(workouts ?? []).length === 0 && (
            <p className="text-sm text-text-dim">עדיין אין אימונים רשומים.</p>
          )}
          {(workouts ?? []).map((w) => (
            <Card key={w.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{w.name}</div>
                  <div className="text-xs text-text-dim">
                    {formatHebrewDate(w.date)}
                    {w.durationMin ? ` · ${w.durationMin} דק'` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => w.id && workoutsRepo.remove(w.id)}
                  className="text-text-dim hover:text-danger"
                >
                  <IconTrash size={16} />
                </button>
              </div>
              {w.exercises.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 text-sm text-text-dim">
                  {w.exercises.map((ex, i) => (
                    <li key={i}>
                      {ex.name} — {ex.sets.map((s) => `${s.reps}×${s.weight}`).join(', ')}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
