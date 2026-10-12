import { useState } from 'react'
import Gravestone from '../components/Gravestone'
import Sheet from '../components/Sheet'
import Sprite from '../components/Sprite'
import { Button } from '../components/ui'
import { getSpecies } from '../data/pokedex'
import { displayName, moveTo } from '../db/repository'
import type { Encounter } from '../db/types'
import { useRun } from '../lib/runContext'
import { useSettings, useT } from '../lib/settings'
import { spriteStyleForRun, type SpriteStyle } from '../lib/sprites'

export default function Graveyard() {
  const t = useT()
  const { run, encounters } = useRun()
  const style = spriteStyleForRun(run)
  const [selected, setSelected] = useState<Encounter>()
  const dead = encounters.filter((e) => e.status === 'dead').sort((a, b) => (b.death?.at ?? 0) - (a.death?.at ?? 0))

  if (!dead.length) {
    return (
      <div className="animate-rise-in flex h-full flex-col items-center justify-center text-center text-text-dim">
        <Gravestone name="…" />
        <p className="mt-4">{t('graveyardEmpty')}</p>
      </div>
    )
  }

  return (
    <div className="animate-rise-in">
      <div className="mb-3 text-center text-sm text-text-dim">
        🕯️ {dead.length} 🕯️
      </div>
      <div className="grid grid-cols-2 gap-3">
        {dead.map((e) => (
          <button key={e.id} type="button" onClick={() => setSelected(e)} className="card flex flex-col items-center px-3 pb-3 pt-2 text-center">
            <Sprite id={e.speciesId} style={style} size={56} dead shiny={e.shiny} />
            <div className="font-bold">
              <bdi>{displayName(e)}</bdi>
            </div>
            <div className="text-xs text-text-dim">
              {getSpecies(e.speciesId)?.name}
              {e.death?.level && ` · ${t('lv')} ${e.death.level}`}
            </div>
            {e.death?.killer && <div className="mt-1 line-clamp-2 text-xs text-danger">{t('killedBy', { killer: e.death.killer })}</div>}
            {e.death?.epitaph && <div className="mt-1 line-clamp-2 text-xs italic text-text-dim">“{e.death.epitaph}”</div>}
          </button>
        ))}
      </div>
      {selected && <GraveSheet encounter={selected} style={style} onClose={() => setSelected(undefined)} />}
    </div>
  )
}

function GraveSheet({ encounter, style, onClose }: { encounter: Encounter; style: SpriteStyle; onClose: () => void }) {
  const t = useT()
  const { lang } = useSettings()
  const name = displayName(encounter)
  const d = encounter.death
  const rows: [string, string | undefined][] = [
    [t('killer'), d?.killer],
    [t('deathLocation'), d?.location],
    [t('cause'), d?.cause],
    [t('level'), d?.level?.toString()],
  ]

  async function revive() {
    if (confirm(t('reviveConfirm', { name }))) {
      await moveTo(encounter, 'box')
      onClose()
    }
  }

  return (
    <Sheet
      title={<bdi>{name}</bdi>}
      onClose={onClose}
      footer={
        <>
          <Button tone="ghost" onClick={revive}>
            {t('revive')}
          </Button>
          <Button className="flex-1" tone="soft" onClick={onClose}>
            {t('close')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          <Gravestone name={name} />
          <div className="absolute -top-6 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
            <Sprite id={encounter.speciesId} style={style} size={64} dead shiny={encounter.shiny} />
          </div>
        </div>
        {d?.epitaph && <p className="mt-3 text-center italic text-text-dim">“{d.epitaph}”</p>}
        {d?.at && <p className="mt-1 text-xs text-text-dim">{new Date(d.at).toLocaleDateString(lang)}</p>}
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-border pb-2">
              <dt className="text-text-dim">{k}</dt>
              <dd className="text-end font-medium">{v}</dd>
            </div>
          ))}
        <div className="text-text-dim">{t('caughtAt', { location: encounter.location })}</div>
      </dl>
    </Sheet>
  )
}
