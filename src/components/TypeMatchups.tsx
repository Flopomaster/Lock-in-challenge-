import { getSpecies, typesInGen } from '../data/pokedex'
import type { Encounter } from '../db/types'
import { useT } from '../lib/settings'
import { multiplier, typesForGen } from '../lib/typeChart'
import { Label, TypeBadge } from './ui'

/** For each attacking type: how many party members are weak to it vs. resist/immune. */
export default function TypeMatchups({ party, gen }: { party: Encounter[]; gen: number }) {
  const t = useT()
  const partyTypes = party.map((e) => getSpecies(e.speciesId)).filter((s) => !!s).map((s) => typesInGen(s, gen))
  if (!partyTypes.length) return null

  const rows = typesForGen(gen).map((type) => {
    const xs = partyTypes.map((types) => multiplier(type, types, gen))
    return { type, weak: xs.filter((x) => x > 1).length, resist: xs.filter((x) => x < 1).length }
  })
  const max = partyTypes.length

  return (
    <section className="card p-4">
      <Label>{t('typeMatchups')}</Label>
      <p className="-mt-1 mb-3 text-xs text-text-dim">{t('typeMatchupsHint')}</p>
      <div className="mb-1.5 flex text-[10px] font-semibold uppercase text-text-dim">
        <span className="w-20" />
        <span className="flex-1 text-center text-danger">{t('weak')}</span>
        <span className="flex-1 text-center text-good">{t('resist')}</span>
      </div>
      <div className="space-y-1">
        {rows.map((r) => {
          const danger = r.weak >= 2 && r.resist === 0
          return (
            <div key={r.type} className={`flex items-center gap-2 rounded-lg px-1 py-0.5 ${danger ? 'bg-danger-bg' : ''}`} title={danger ? t('dangerType', { count: r.weak }) : undefined}>
              <span className="w-20 shrink-0">
                <TypeBadge type={r.type} small />
              </span>
              <Bar value={r.weak} max={max} className="bg-danger" />
              <Bar value={r.resist} max={max} className="bg-good" />
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <div className="flex flex-1 items-center gap-1.5">
      <div className="flex h-2.5 flex-1 gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`flex-1 rounded-sm ${i < value ? className : 'bg-surface-hi'}`} />
        ))}
      </div>
      <span className="w-3 text-xs tabular-nums text-text-dim">{value || ''}</span>
    </div>
  )
}
