import { useLiveQuery } from 'dexie-react-hooks'
import PageShell from '../components/PageShell'
import Sprite from '../components/Sprite'
import { Label } from '../components/ui'
import { getSpecies } from '../data/pokedex'
import { db } from '../db/db'
import { useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'

export default function Stats() {
  const t = useT()
  const data = useLiveQuery(async () => ({ runs: await db.runs.toArray(), encounters: await db.encounters.toArray() }))
  if (!data) return null
  const { runs, encounters } = data

  const caught = encounters.filter((e) => e.status !== 'missed')
  const dead = encounters.filter((e) => e.status === 'dead')
  const won = runs.filter((r) => r.status === 'won').length
  const lost = runs.filter((r) => r.status === 'lost').length
  const finished = won + lost

  const killers = topCounts(dead.map((e) => e.death?.killer?.trim()).filter((k): k is string => !!k))
  const places = topCounts(dead.map((e) => (e.death?.location || e.location).trim()))
  const species = topCounts(caught.map((e) => String(getSpecies(e.speciesId)?.chain ?? '')).filter(Boolean))
  const perRun = runs
    .map((r) => ({ label: r.name, value: dead.filter((e) => e.runId === r.id).length }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Show each favourite family by its most-caught member's sprite.
  const familySprite = (chain: string) => {
    const members = caught.filter((e) => String(getSpecies(e.speciesId)?.chain) === chain)
    return members[0]?.speciesId
  }

  return (
    <PageShell title={t('stats')}>
      {!encounters.length ? (
        <div className="card p-6 text-center text-text-dim">{t('noStats')}</div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2.5">
            <Tile label={t('statRuns')} value={runs.length} />
            <Tile label={t('statWins')} value={won} />
            <Tile label={t('statWinRate')} value={finished ? `${Math.round((won / finished) * 100)}%` : '—'} />
            <Tile label={t('statCaught')} value={caught.length} />
            <Tile label={t('statDeaths')} value={dead.length} />
            <Tile label={t('statSurvival')} value={caught.length ? `${Math.round(((caught.length - dead.length) / caught.length) * 100)}%` : '—'} />
          </div>

          {killers.length > 0 && <BarList title={t('topKillers')} rows={killers} />}
          {places.length > 0 && <BarList title={t('deadliestPlaces')} rows={places} ltr />}
          {perRun.length > 0 && <BarList title={t('deathsPerRun')} rows={perRun} />}

          {species.length > 0 && (
            <section className="card p-4">
              <Label>{t('favoriteSpecies')}</Label>
              <div className="grid grid-cols-5 gap-2">
                {species.slice(0, 10).map((s) => {
                  const id = familySprite(s.label)
                  const run = runs.find((r) => r.id === caught.find((e) => e.speciesId === id)?.runId)
                  return (
                    <div key={s.label} className="flex flex-col items-center" title={`${getSpecies(id)?.name} × ${s.value}`}>
                      <Sprite id={id} style={spriteStyleForRun(run)} size={48} />
                      <span className="text-xs font-semibold tabular-nums" dir="ltr">
                        ×{s.value}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </PageShell>
  )
}

function topCounts(values: string[]): { label: string; value: number }[] {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card px-2 py-3 text-center">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs font-medium text-text-dim">{label}</div>
    </div>
  )
}

/** Single-series ranked bars: one hue, value labels in text ink, the bar only carries magnitude. */
function BarList({ title, rows, ltr }: { title: string; rows: { label: string; value: number }[]; ltr?: boolean }) {
  const max = Math.max(...rows.map((r) => r.value))
  return (
    <section className="card p-4">
      <Label>{title}</Label>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} title={`${r.label}: ${r.value}`}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="truncate" dir={ltr ? 'ltr' : 'auto'}>
                {r.label}
              </span>
              <span className="font-semibold tabular-nums">{r.value}</span>
            </div>
            <div className="h-2 rounded-full bg-surface-hi">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
