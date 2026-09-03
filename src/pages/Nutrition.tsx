import { useLiveQuery } from 'dexie-react-hooks'
import { lazy, Suspense, useMemo, useState } from 'react'
import BodyStatsCard from '../components/BodyStatsCard'
import { Card, SectionHeader } from '../components/Card'
import { IconBarcode, IconEdit, IconPlus, IconTrash } from '../components/icons'
import LabelPhotoScanner from '../components/LabelPhotoScanner'
import { mealsRepo } from '../db/repository'
import type { Meal, MealItem } from '../db/types'
import { computeFromGrams, searchFoods, type FoodItem } from '../data/foods'
import { lookupBarcode, type ScannedProduct } from '../data/openFoodFacts'
import { formatHebrewDate, todayStr } from '../lib/dates'

const BarcodeScanner = lazy(() => import('../components/BarcodeScanner'))

function BarcodeItemPicker({ onAdd }: { onAdd: (item: MealItem) => void }) {
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<ScannedProduct | null>(null)
  const [grams, setGrams] = useState('100')

  const computed = product ? computeFromGrams({ ...product, id: 'scanned', category: '' }, Number(grams) || 0) : null

  async function handleDetect(code: string) {
    setShowScanner(false)
    setLoading(true)
    setError(null)
    try {
      const result = await lookupBarcode(code)
      if (result) {
        setProduct(result)
        setGrams('100')
      } else {
        setError('המוצר לא נמצא במאגר. אפשר לנסות לצלם את תווית הערכים, או להוסיף ידנית.')
      }
    } catch {
      setError('בעיית חיבור לאינטרנט בעת חיפוש המוצר. נסה שוב, או הוסף ידנית.')
    } finally {
      setLoading(false)
    }
  }

  function add() {
    if (!product || !computed) return
    onAdd({ name: product.name, ...computed })
    setProduct(null)
    setError(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {!product && (
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-1.5 text-sm text-text-dim disabled:opacity-40"
        >
          <IconBarcode size={16} />
          {loading ? 'מחפש מוצר...' : 'סרוק ברקוד מוצר'}
        </button>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      {product && computed && (
        <div className="flex flex-col gap-2 rounded-xl border border-primary-border bg-primary-bg p-3">
          <div className="text-sm font-medium">{product.name}</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="w-20 rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
            <span className="text-sm text-text-dim">גרם</span>
          </div>
          <div className="text-sm text-text-dim">
            {computed.calories} קק"ל · חלבון {computed.protein} · פחמימה {computed.carbs} · שומן{' '}
            {computed.fat}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={add}
              className="flex-1 rounded-lg bg-primary py-1.5 text-sm font-semibold text-primary-ink"
            >
              הוסף לארוחה
            </button>
            <button
              type="button"
              onClick={() => setProduct(null)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-dim"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {showScanner && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-sm text-white">
              טוען סורק...
            </div>
          }
        >
          <BarcodeScanner onDetect={handleDetect} onClose={() => setShowScanner(false)} />
        </Suspense>
      )}
    </div>
  )
}

function FoodPicker({ onAdd }: { onAdd: (item: MealItem) => void }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [mode, setMode] = useState<'grams' | 'units'>('grams')
  const [quantity, setQuantity] = useState('100')

  const results = useMemo(() => (selected ? [] : searchFoods(query)), [query, selected])
  const grams =
    mode === 'units' && selected?.gramsPerUnit
      ? (Number(quantity) || 0) * selected.gramsPerUnit
      : Number(quantity) || 0
  const computed = selected ? computeFromGrams(selected, grams) : null

  function pick(food: FoodItem) {
    setSelected(food)
    setQuery(food.name)
    if (food.gramsPerUnit) {
      setMode('units')
      setQuantity('1')
    } else {
      setMode('grams')
      setQuantity('100')
    }
  }

  function clear() {
    setSelected(null)
    setQuery('')
    setMode('grams')
    setQuantity('100')
  }

  function add() {
    if (!selected || !computed) return
    onAdd({ name: selected.name, ...computed })
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
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20 rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
            />
            {selected.gramsPerUnit ? (
              <div className="flex gap-1 rounded-lg bg-surface-hi p-0.5">
                <button
                  type="button"
                  onClick={() => setMode('units')}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    mode === 'units' ? 'bg-primary text-primary-ink' : 'text-text-dim'
                  }`}
                >
                  {selected.unitLabel ?? 'יחידות'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('grams')}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    mode === 'grams' ? 'bg-primary text-primary-ink' : 'text-text-dim'
                  }`}
                >
                  גרם
                </button>
              </div>
            ) : (
              <span className="text-sm text-text-dim">גרם</span>
            )}
            {mode === 'units' && selected.gramsPerUnit && (
              <span className="text-xs text-text-dim">≈ {grams} גרם</span>
            )}
          </div>
          <div className="text-sm text-text-dim">
            {computed.calories} קק"ל · חלבון {computed.protein} · פחמימה {computed.carbs} · שומן{' '}
            {computed.fat}
          </div>
          <button
            type="button"
            onClick={add}
            className="rounded-lg bg-primary py-1.5 text-sm font-semibold text-primary-ink"
          >
            הוסף לארוחה
          </button>
        </div>
      )}
    </div>
  )
}

function ManualItemForm({ onAdd }: { onAdd: (item: MealItem) => void }) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  function add() {
    if (!name.trim() || !calories) return
    onAdd({
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
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-text-dim">או הוספה ידנית</div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם הפריט"
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
        onClick={add}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-1.5 text-sm text-text-dim"
      >
        <IconPlus size={14} />
        הוסף פריט
      </button>
    </div>
  )
}

function itemTotals(items: MealItem[]) {
  return items.reduce(
    (acc, i) => ({
      calories: acc.calories + i.calories,
      protein: acc.protein + (i.protein ?? 0),
      carbs: acc.carbs + (i.carbs ?? 0),
      fat: acc.fat + (i.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export default function Nutrition() {
  const [date, setDate] = useState(todayStr())
  const [mealName, setMealName] = useState('')
  const [items, setItems] = useState<MealItem[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)

  const viewDate = date
  const meals = useLiveQuery(() => mealsRepo.byDate(viewDate), [viewDate], [])

  const dayTotals = (meals ?? []).reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const pendingTotals = itemTotals(items)

  function resetForm() {
    setMealName('')
    setItems([])
    setEditingId(null)
  }

  function startEdit(meal: Meal) {
    setEditingId(meal.id!)
    setMealName(meal.name)
    setItems(
      meal.items && meal.items.length > 0
        ? meal.items
        : [{ name: meal.name, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat }],
    )
  }

  function addItem(item: MealItem) {
    setItems((prev) => [...prev, item])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSaveMeal() {
    if (items.length === 0) return
    const totals = itemTotals(items)
    const values = {
      date,
      name: mealName.trim() || items.map((i) => i.name).join(' + '),
      calories: totals.calories,
      protein: totals.protein || undefined,
      carbs: totals.carbs || undefined,
      fat: totals.fat || undefined,
      items,
    }
    if (editingId) {
      await mealsRepo.update(editingId, values)
    } else {
      await mealsRepo.add(values)
    }
    resetForm()
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
            <div className="text-lg font-bold">{dayTotals.calories}</div>
            <div className="text-xs text-text-dim">קק"ל</div>
          </div>
          <div>
            <div className="text-lg font-bold">{dayTotals.protein}</div>
            <div className="text-xs text-text-dim">חלבון</div>
          </div>
          <div>
            <div className="text-lg font-bold">{dayTotals.carbs}</div>
            <div className="text-xs text-text-dim">פחמימה</div>
          </div>
          <div>
            <div className="text-lg font-bold">{dayTotals.fat}</div>
            <div className="text-xs text-text-dim">שומן</div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title={editingId ? 'עריכת ארוחה' : 'בניית ארוחה'} />
        <div className="flex flex-col gap-3">
          <FoodPicker onAdd={addItem} />
          <BarcodeItemPicker onAdd={addItem} />
          <LabelPhotoScanner onAdd={addItem} />
          <ManualItemForm onAdd={addItem} />

          {items.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <div className="text-xs font-semibold text-text-dim">פריטים בארוחה</div>
              {items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{it.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-dim">{it.calories} קק"ל</span>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-text-dim hover:text-danger"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t border-border pt-2 text-sm font-medium">
                סה"כ: {pendingTotals.calories} קק"ל · חלבון {pendingTotals.protein} · פחמימה{' '}
                {pendingTotals.carbs} · שומן {pendingTotals.fat}
              </div>
            </div>
          )}

          <input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="שם הארוחה (אופציונלי, למשל: ארוחת בוקר)"
            className="rounded-lg border border-border bg-surface-hi px-2 py-1.5 text-sm text-text"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveMeal}
              disabled={items.length === 0}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-ink disabled:opacity-40"
            >
              {editingId ? 'עדכן ארוחה' : `סיימתי, שמור ארוחה${items.length > 0 ? ` (${items.length} פריטים)` : ''}`}
            </button>
            {(editingId || items.length > 0) && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-dim"
              >
                ביטול
              </button>
            )}
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
                {m.items && m.items.length > 1 && (
                  <div className="text-xs text-text-dim">{m.items.map((i) => i.name).join(' + ')}</div>
                )}
                <div className="text-xs text-text-dim">
                  {m.calories} קק"ל
                  {m.protein ? ` · חלבון ${m.protein}` : ''}
                  {m.carbs ? ` · פחמימה ${m.carbs}` : ''}
                  {m.fat ? ` · שומן ${m.fat}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  className="text-text-dim hover:text-primary"
                >
                  <IconEdit size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => m.id && mealsRepo.remove(m.id)}
                  className="text-text-dim hover:text-danger"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
