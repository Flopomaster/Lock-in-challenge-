import { useMemo, useState } from 'react'
import Sprite from '../components/Sprite'
import { Button, Segmented } from '../components/ui'
import { POKEDEX, getSpecies } from '../data/pokedex'
import { displayName, runMaxDex } from '../db/repository'
import { useRun } from '../lib/runContext'
import { useSettings, useT } from '../lib/settings'
import { spriteUrls, spriteStyleForRun } from '../lib/sprites'
import { playCatchSound } from '../lib/sound'

type Mode = 'pokemon' | 'box' | 'rule'

const RULES = {
  en: [
    'Next fight: no switching',
    'Monotype party until the next badge',
    'Next catch must join the party',
    'No healing at the Pokémon Center until the next badge',
    'Lead with your lowest-level Pokémon',
    'No Poké Mart purchases until the next gym',
    'Your weakest Pokémon must win the next trainer battle',
    'Release your highest-level box Pokémon',
    'Only 3 Pokémon allowed in the next gym',
    'Use the first move slot only in the next fight',
    'Nickname the next catch after a friend',
    'Swap your lead with a random box Pokémon',
  ],
  he: [
    'בקרב הבא: בלי להחליף',
    'קבוצה מסוג אחד עד התג הבא',
    'התפיסה הבאה חייבת להיכנס לקבוצה',
    'בלי מרכז פוקימון עד התג הבא',
    'פותחים עם הפוקימון בלבל הכי נמוך',
    'בלי קניות ב-Poké Mart עד הג׳ים הבא',
    'הפוקימון הכי חלש חייב לנצח את הקרב הבא',
    'שחרר את הפוקימון בלבל הכי גבוה בקופסה',
    'רק 3 פוקימונים בג׳ים הבא',
    'בקרב הבא רק המהלך הראשון',
    'התפיסה הבאה מקבלת שם של חבר',
    'החלף את המוביל בפוקימון רנדומלי מהקופסה',
  ],
}

const SLICES = 12

interface Option {
  key: string
  label: string
  speciesId?: number
}

export default function Wheel() {
  const t = useT()
  const { lang, sound } = useSettings()
  const { run, encounters } = useRun()
  const style = spriteStyleForRun(run)
  const [mode, setMode] = useState<Mode>('pokemon')
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [slices, setSlices] = useState<Option[]>([])
  const [result, setResult] = useState<Option>()

  const pool = useMemo<Option[]>(() => {
    if (mode === 'box')
      return encounters.filter((e) => e.status === 'box').map((e) => ({ key: String(e.id), label: displayName(e), speciesId: e.speciesId }))
    if (mode === 'rule') return RULES[lang].map((r, i) => ({ key: String(i), label: r }))
    return POKEDEX.slice(0, runMaxDex(run)).map((s) => ({ key: String(s.id), label: s.name, speciesId: s.id }))
  }, [mode, encounters, lang, run])

  // A stable preview of the pool until the first spin picks real slices.
  const preview = useMemo(() => sample(pool, SLICES), [pool])
  const shown = slices.length ? slices : preview

  function spin() {
    if (!pool.length || spinning) return
    const winner = pool[Math.floor(Math.random() * pool.length)]
    // The wheel shows up to 12 slices; make sure the winner is one of them.
    const others = sample(
      pool.filter((o) => o.key !== winner.key),
      Math.min(SLICES, pool.length) - 1,
    )
    const index = Math.floor(Math.random() * (others.length + 1))
    const next = [...others.slice(0, index), winner, ...others.slice(index)]
    const slice = 360 / next.length
    // Land the winner's slice center under the pointer at the top, after a few full turns.
    const target = 360 - (index + 0.5) * slice
    const turns = 360 * (5 + Math.floor(Math.random() * 3))
    setSlices(next)
    setResult(undefined)
    setSpinning(true)
    setAngle((a) => a - (a % 360) + turns + target)
    setTimeout(() => {
      setSpinning(false)
      setResult(winner)
      if (sound) playCatchSound()
    }, 4200)
  }

  function changeMode(m: Mode) {
    setMode(m)
    setSlices([])
    setResult(undefined)
  }

  const n = shown.length
  const slice = 360 / Math.max(n, 1)

  return (
    <div className="animate-rise-in space-y-5">
      <Segmented
        value={mode}
        onChange={changeMode}
        options={[
          { value: 'pokemon', label: t('wheelPokemon') },
          { value: 'box', label: t('wheelBox') },
          { value: 'rule', label: t('wheelRule') },
        ]}
      />

      {!pool.length ? (
        <div className="card p-6 text-center text-text-dim">{t('wheelEmptyBox')}</div>
      ) : (
        <>
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="absolute start-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1 rtl:translate-x-1/2">
              <svg width="28" height="30" viewBox="0 0 28 30">
                <path d="M14 30 2 6a14 14 0 0 1 24 0Z" fill="var(--primary)" stroke="var(--surface)" strokeWidth="2" />
              </svg>
            </div>
            <svg
              viewBox="-100 -100 200 200"
              className="h-full w-full drop-shadow-md"
              style={{ transform: `rotate(${angle}deg)`, transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.85, 0.2, 1)' : 'none' }}
            >
              <circle r="98" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
              {shown.map((o, i) => {
                const a0 = ((i * slice - 90) * Math.PI) / 180
                const a1 = (((i + 1) * slice - 90) * Math.PI) / 180
                const mid = (((i + 0.5) * slice - 90) * Math.PI) / 180
                const large = slice > 180 ? 1 : 0
                const path = n === 1 ? undefined : `M0 0 L${96 * Math.cos(a0)} ${96 * Math.sin(a0)} A96 96 0 ${large} 1 ${96 * Math.cos(a1)} ${96 * Math.sin(a1)} Z`
                const fill = i % 2 ? 'var(--surface-hi)' : 'var(--primary-bg)'
                const cx = 64 * Math.cos(mid)
                const cy = 64 * Math.sin(mid)
                return (
                  <g key={o.key}>
                    {path ? <path d={path} fill={fill} stroke="var(--surface)" strokeWidth="1.5" /> : <circle r="96" fill={fill} />}
                    {o.speciesId ? (
                      <image
                        href={spriteUrls(o.speciesId, style)[0]}
                        x={cx - 17}
                        y={cy - 17}
                        width="34"
                        height="34"
                        transform={`rotate(${(i + 0.5) * slice} ${cx} ${cy})`}
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="700" fill="var(--text)">
                        {i + 1}
                      </text>
                    )}
                  </g>
                )
              })}
              <circle r="14" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
            </svg>
          </div>

          <Button className="w-full !py-3.5 text-lg" onClick={spin} disabled={spinning}>
            🎡 {t('spin')}
          </Button>

          {result && (
            <div className="card animate-rise-in flex items-center gap-3 p-4">
              {result.speciesId && <Sprite id={result.speciesId} style={style} size={64} />}
              <div>
                <div className="text-xs text-text-dim">{t('wheelResult')}</div>
                <div className="text-lg font-bold">
                  <bdi>{result.label}</bdi>
                </div>
                {mode === 'box' && result.speciesId && <div className="text-sm text-text-dim">{getSpecies(result.speciesId)?.name}</div>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function sample<T>(list: T[], count: number): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}
