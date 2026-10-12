import { useState } from 'react'
import { createPortal } from 'react-dom'
import { displayName, moveTo, runLocations } from '../db/repository'
import type { Encounter, Run } from '../db/types'
import type { GameData } from '../data/gameData'
import { playDeathSound } from '../lib/sound'
import { useSettings, useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'
import Gravestone from './Gravestone'
import Sheet from './Sheet'
import Sprite from './Sprite'
import { Button, Label } from './ui'

interface Props {
  run: Run
  encounter: Encounter
  data: GameData | null
  onClose: () => void
}

/** Asks how the Pokémon died, then plays a full-screen funeral. */
export default function DeathFlow({ run, encounter, data, onClose }: Props) {
  const t = useT()
  const { sound } = useSettings()
  const style = spriteStyleForRun(run)
  const name = displayName(encounter)

  const [stage, setStage] = useState<'form' | 'ceremony'>('form')
  const [level, setLevel] = useState(encounter.level?.toString() ?? '')
  const [killer, setKiller] = useState('')
  const [location, setLocation] = useState('')
  const [cause, setCause] = useState('')
  const [epitaph, setEpitaph] = useState('')

  async function confirmDeath() {
    await moveTo(encounter, 'dead', {
      at: Date.now(),
      level: level ? Number(level) : undefined,
      killer: killer.trim() || undefined,
      location: location.trim() || undefined,
      cause: cause.trim() || undefined,
      epitaph: epitaph.trim() || undefined,
    })
    if (sound) playDeathSound()
    setStage('ceremony')
  }

  if (stage === 'ceremony') {
    return createPortal(
      <div className="death-overlay fixed inset-0 z-50 backdrop-blur-sm flex flex-col items-center justify-center px-8 text-center text-white" onClick={onClose}>
        <div className="death-flash pointer-events-none absolute inset-0 bg-white" />
        <div className="relative flex h-56 w-56 items-end justify-center">
          <div className="death-shake absolute bottom-24">
            <div className="death-faint">
              <Sprite id={encounter.speciesId} style={style} size={128} shiny={encounter.shiny} />
            </div>
          </div>
          <Gravestone className="grave-rise" name={name} />
        </div>
        <div className="death-text mt-8">
          <div className="text-2xl font-bold">{t('deathTitle', { name })}</div>
          {epitaph && <div className="mt-2 italic text-white/70">“{epitaph}”</div>}
        </div>
        <div className="death-actions mt-8">
          <Button tone="soft" onClick={onClose} className="!bg-white/10 !text-white">
            {t('close')}
          </Button>
        </div>
      </div>,
      document.body,
    )
  }

  return (
    <Sheet
      title={
        <span className="flex items-center gap-2">
          <Sprite id={encounter.speciesId} style={style} size={32} />
          <bdi>{name}</bdi>
        </span>
      }
      onClose={onClose}
      footer={
        <Button className="flex-1 !bg-danger" onClick={confirmDeath}>
          🪦 {t('confirmDeath')}
        </Button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-text-dim">{t('deathSubtitle')}</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label>{t('killer')}</Label>
            <input className="field" value={killer} onChange={(e) => setKiller(e.target.value)} placeholder={t('killerPlaceholder')} />
          </div>
          <div>
            <Label>{t('level')}</Label>
            <input className="field" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value.replace(/\D/g, '').slice(0, 3))} />
          </div>
        </div>
        <div>
          <Label>{t('deathLocation')}</Label>
          <input className="field" list="death-locations" value={location} onChange={(e) => setLocation(e.target.value)} />
          <datalist id="death-locations">
            {runLocations(run, data).map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <div>
          <Label>{t('cause')}</Label>
          <input className="field" value={cause} onChange={(e) => setCause(e.target.value)} placeholder={t('causePlaceholder')} />
        </div>
        <div>
          <Label>{t('epitaph')}</Label>
          <input className="field" value={epitaph} onChange={(e) => setEpitaph(e.target.value)} placeholder={t('epitaphPlaceholder')} maxLength={80} />
        </div>
      </div>
    </Sheet>
  )
}
