import { useRef, useState } from 'react'
import { parseNutritionLabel } from '../lib/parseNutritionLabel'
import { IconCamera } from './icons'

export default function LabelPhotoScanner({
  onAdd,
}: {
  onAdd: (item: { name: string; calories: number; protein?: number; carbs?: number; fat?: number }) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'scanning' | 'review'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  async function handleFile(file: File) {
    setStatus('scanning')
    setError(null)
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng+heb')
      const {
        data: { text },
      } = await worker.recognize(file)
      await worker.terminate()

      const parsed = parseNutritionLabel(text)
      setName('')
      setCalories(parsed.calories !== undefined ? String(parsed.calories) : '')
      setProtein(parsed.protein !== undefined ? String(parsed.protein) : '')
      setCarbs(parsed.carbs !== undefined ? String(parsed.carbs) : '')
      setFat(parsed.fat !== undefined ? String(parsed.fat) : '')
      setStatus('review')
    } catch {
      setError(
        'לא הצלחתי לקרוא את התמונה. בפעם הראשונה נדרש חיבור אינטרנט להורדת מנוע הזיהוי — ודא שיש חיבור ונסה שוב, או הזן ידנית.',
      )
      setStatus('idle')
    }
  }

  function reset() {
    setStatus('idle')
    setName('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function add() {
    if (!name.trim() || !calories) return
    onAdd({
      name: name.trim(),
      calories: Number(calories),
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
    })
    reset()
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {status === 'idle' && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-1.5 text-sm text-text-dim"
        >
          <IconCamera size={16} />
          צלם תווית ערכים תזונתיים
        </button>
      )}

      {status === 'scanning' && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-text-dim">
          מזהה טקסט מהתמונה...
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      {status === 'review' && (
        <div className="flex flex-col gap-2 rounded-xl border border-secondary-border bg-secondary-bg p-3">
          <div className="text-xs font-semibold text-secondary">
            בדוק ותקן את הערכים שזוהו (זיהוי אוטומטי לא תמיד מדויק)
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם המוצר"
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={add}
              disabled={!name.trim() || !calories}
              className="flex-1 rounded-lg bg-secondary py-1.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              הוסף לארוחה
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-dim"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
