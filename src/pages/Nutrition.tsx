import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import BodyStatsCard from '../components/BodyStatsCard'
import { Card, SectionHeader } from '../components/Card'
import { IconTrash } from '../components/icons'
import { mealsRepo } from '../db/repository'
import { computeFromGrams, searchFoods, type FoodItem } from '../data/foods'
import { formatHebrewDate, todayStr } from '../lib/dates'

function FoodPicker({
  onApply,
}: {
  onApply: (values: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [grams, setGrams] = useState('100')

  const results = useMemo(() => (selected ? [] : searchFoods(query)), [query, selected])
  const computed = selected ? computeFromGrams(selected, Number(grams) || 0) : null

  function pick(food: FoodItem) {
    setSelected(food)
    setQuery(food.name)
    setGrams(String(food.gramsPerUnit ?? 100))
  }

  function clear() {
    setSelected(null)
    setQuery('')
    setGrams('100')
  }

  function apply() {
    if (!selected || !computed) return
    onApply({ name: selected.name, ...computed })
    clear()
  }

  return (
    <div className="rounded-xl border border-primary-border bg-primary-bg p-3">
      <div className="mb-2 text-xs font-semibold text-primary">חיפוש במאגר המזונות</div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(null)
          }}
          placeholder="חפש מזון... (למשל: עוף, אורז, ביצה)"
          className="w-full rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface-hi shadow-lg">
            {results.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => pick(f)}
                className="flex w-full items-center justify-between px-3 py-2 text-right text-sm hover:bg-surface"
              >
                <span>{f.name}</span>
                <span className="text-xs text-text-dim">{f.calories} קק"ל/100ג</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && computed && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="w-24 rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
            <span className="text-sm text-text-dim">גרם</span>
            {selected.gramsPerUnit && (
              <button
                type="button"
                onClick={() => setGrams(String(selected.gramsPerUnit))}
                className="text-xs text-secondary"
              >
                {selected.unitLabel} ({selected.gramsPerUnit}ג׳)
              </button>
            )}
          </div>
          <div className="text-sm text-text-dim">
            {computed.calories} קק"ל · חלבון {computed.protein} · פחמימה {computed.carbs} · שומן{' '}
            {computed.fat}
          </div>
          <button
            type="button"
            onClick={apply}
            className="rounded-lg bg-primary py-1.5 text-sm font-semibold text-primary-ink"
          >
            השתמש בערכים אלו
          </button>
        </div>
      )}
    </div>
  )
}

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
      <BodyStatsCard />

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
        <div className="flex flex-col gap-3">
          <FoodPicker
            onApply={(v) => {
              setName(v.name)
              setCalories(String(v.calories))
              setProtein(String(v.protein))
              setCarbs(String(v.carbs))
              setFat(String(v.fat))
            }}
          />

          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם הארוחה (או ערוך ידנית)"
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
              className="rounded-lg bg-primary py-2 text-sm font-semibold text-primary-ink"
            >
              הוסף ארוחה
            </button>
          </div>
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
                className="text-text-dim hover:text-danger"
              >
                <IconTrash size={16} />
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
