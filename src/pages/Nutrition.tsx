import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, SectionHeader } from '../components/Card'
import { mealsRepo } from '../db/repository'
import { formatHebrewDate, todayStr } from '../lib/dates'

export default function Nutrition() {
  const [date, setDate] = useState(todayStr())
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const viewDate = date
  const meals = useLiveQuery(() => mealsRepo.byDate(viewDate), [viewDate], [])

  const totals = (meals ?? []).reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  async function handleSubmit() {
    if (!name.trim() || !calories) return
    await mealsRepo.add({
      date,
      name: name.trim(),
      calories: Number(calories),
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
    })
    setName('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs text-text-dim">
        תאריך
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-40 rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-text"
        />
      </label>

      <Card>
        <SectionHeader title={`סה"כ ל-${formatHebrewDate(date)}`} />
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div>
            <div className="text-lg font-bold">{totals.calories}</div>
            <div className="text-xs text-text-dim">קק"ל</div>
          </div>
          <div>
            <div className="text-lg font-bold">{totals.protein}</div>
            <div className="text-xs text-text-dim">חלבון</div>
          </div>
          <div>
            <div className="text-lg font-bold">{totals.carbs}</div>
            <div className="text-xs text-text-dim">פחמימה</div>
          </div>
          <div>
            <div className="text-lg font-bold">{totals.fat}</div>
            <div className="text-xs text-text-dim">שומן</div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="הוספת ארוחה" />
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם הארוחה"
            className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
          />
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder='קק"ל'
              className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="חלבון"
              className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="פחמימה"
              className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
            <input
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="שומן"
              className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-accent py-2 text-sm font-semibold text-white"
          >
            הוסף ארוחה
          </button>
        </div>
      </Card>

      <div>
        <SectionHeader title="ארוחות" />
        <div className="flex flex-col gap-2">
          {(meals ?? []).length === 0 && (
            <p className="text-sm text-text-dim">אין ארוחות רשומות ליום זה.</p>
          )}
          {(meals ?? []).map((m) => (
            <Card key={m.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-text-dim">
                  {m.calories} קק"ל
                  {m.protein ? ` · חלבון ${m.protein}` : ''}
                  {m.carbs ? ` · פחמימה ${m.carbs}` : ''}
                  {m.fat ? ` · שומן ${m.fat}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => m.id && mealsRepo.remove(m.id)}
                className="text-xs text-text-dim hover:text-accent"
              >
                מחק
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
