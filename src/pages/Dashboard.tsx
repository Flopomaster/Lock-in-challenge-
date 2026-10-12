import { useState } from 'react'
import { Link } from 'react-router-dom'
import Gravestone from '../components/Gravestone'
import PokemonDetail from '../components/PokemonDetail'
import PokemonTile from '../components/PokemonTile'
import Sprite from '../components/Sprite'
import { IconBadge, IconPlus, IconSkull, IconTrophy } from '../components/icons'
import { Label, Warning } from '../components/ui'
import { byOrder } from '../db/hooks'
import { displayName, runLocations, runMaxBadges, updateRun } from '../db/repository'
import type { Encounter } from '../db/types'
import { RULES } from '../lib/rules'
import { useRun } from '../lib/runContext'
import { useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'

export default function Dashboard() {
  const t = useT()
  const { run, encounters } = useRun()
  const style = spriteStyleForRun(run)
  const [selected, setSelected] = useState<Encounter>()

  const party = encounters.filter((e) => e.status === 'party').sort(byOrder)
  const alive = encounters.filter((e) => e.status === 'party' || e.status === 'box').length
  const dead = encounters.filter((e) => e.status === 'dead')
  const recentDeaths = [...dead].sort((a, b) => (b.death?.at ?? 0) - (a.death?.at ?? 0)).slice(0, 3)
  const totalLocations = runLocations(run).length
  const visited = new Set(encounters.map((e) => e.location)).size
  const maxBadges = runMaxBadges(run)
  const activeRules = RULES.filter((r) => run.rules[r.key])

  const setBadges = (n: number) => updateRun(run.id!, { badges: Math.max(0, Math.min(maxBadges, n)) })

  return (
    <div className="animate-rise-in space-y-4">
      {run.status !== 'active' && (
        <div className={`card flex items-center gap-3 p-4 ${run.status === 'won' ? 'text-good' : 'text-danger'}`}>
          {run.status === 'won' ? <IconTrophy size={28} /> : <IconSkull size={28} />}
          <div className="text-lg font-bold">{run.status === 'won' ? t('statusWon') : t('statusLost')}</div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label={t('alive')} value={alive} tone="text-good" />
        <Stat label={t('dead')} value={dead.length} tone="text-danger" />
        <Stat label={t('encounters')} value={`${visited}/${totalLocations}`} />
      </div>

      {maxBadges > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <Label>{t('badges')}</Label>
            <div className="flex items-center gap-2">
              <button type="button" className="h-7 w-7 rounded-full bg-surface-hi font-bold" onClick={() => setBadges(run.badges - 1)}>
                −
              </button>
              <span className="w-10 text-center font-bold tabular-nums">
                {run.badges}/{maxBadges}
              </span>
              <button type="button" className="h-7 w-7 rounded-full bg-surface-hi font-bold" onClick={() => setBadges(run.badges + 1)}>
                +
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
            {Array.from({ length: maxBadges }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setBadges(i < run.badges ? i : i + 1)}
                className={`rounded-full p-1 transition ${i < run.badges ? 'bg-accent/20 text-accent' : 'bg-surface-hi text-text-dim opacity-40'}`}
              >
                <IconBadge size={18} />
              </button>
            ))}
          </div>
        </div>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <Label>
            {t('party')} · {party.length}/6
          </Label>
        </div>
        {party.length === 0 ? (
          <div className="card p-5 text-center text-text-dim">{t('emptyParty')}</div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {party.map((e) => (
              <PokemonTile key={e.id} encounter={e} style={style} onClick={() => setSelected(e)} />
            ))}
          </div>
        )}
        {party.length === 0 && alive === 0 && encounters.length > 0 && (
          <div className="mt-2">
            <Warning>{t('warnNoParty')}</Warning>
          </div>
        )}
      </section>

      <Link to="/routes" className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-ink shadow">
        <IconPlus size={20} />
        {t('logEncounter')}
      </Link>

      {recentDeaths.length > 0 && (
        <section>
          <Label>{t('recentDeaths')}</Label>
          <Link to="/graveyard" className="card flex items-center gap-1 overflow-hidden p-3">
            {recentDeaths.map((e) => (
              <div key={e.id} className="flex flex-1 flex-col items-center">
                <div className="relative">
                  <Gravestone name={displayName(e)} small />
                  <div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                    <Sprite id={e.speciesId} style={style} size={36} dead />
                  </div>
                </div>
              </div>
            ))}
          </Link>
        </section>
      )}

      {(activeRules.length > 0 || run.customRules.length > 0) && (
        <section className="card p-4">
          <Label>{t('runRules')}</Label>
          <div className="flex flex-wrap gap-1.5">
            {activeRules.map((r) => (
              <span key={r.key} className="rounded-full bg-surface-hi px-2.5 py-1 text-xs font-medium">
                {t(r.label)}
              </span>
            ))}
          </div>
          {run.customRules.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 ps-5 text-sm text-text-dim">
              {run.customRules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {selected && <PokemonDetail run={run} encounter={selected} encounters={encounters} onClose={() => setSelected(undefined)} />}
    </div>
  )
}

function Stat({ label, value, tone = '' }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="card px-3 py-3 text-center">
      <div className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
      <div className="text-xs font-medium text-text-dim">{label}</div>
    </div>
  )
}
