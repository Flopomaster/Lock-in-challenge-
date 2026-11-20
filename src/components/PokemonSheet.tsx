import { useState } from 'react'
import { getGame } from '../data/games'
import { NATURES, evolutionFamily, getSpecies, prettyAbility } from '../data/pokedex'
import { displayName, moveTo, saveEncounter, setAce } from '../db/repository'
import type { Encounter, Run } from '../db/types'
import { useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'
import Sheet from './Sheet'
import AceCrowning from './AceCrowning'
import MovesEditor from './MovesEditor'
import SpeciesPicker from './SpeciesPicker'
import Sprite from './Sprite'
import { Button, Label, Segmented, Toggle } from './ui'

interface Props {
  run: Run
  encounter: Encounter
  partyCount: number
  onClose: () => void
  onDeath: () => void
}

/** Detail + edit sheet for a caught Pokémon (party or box). */
export default function PokemonSheet({ run, encounter, partyCount, onClose, onDeath }: Props) {
  const t = useT()
  const style = spriteStyleForRun(run)
  const [draft, setDraft] = useState(encounter)
  const [evolving, setEvolving] = useState(false)
  const [crowning, setCrowning] = useState(false)
  const isAce = run.aceId === encounter.id
  const species = getSpecies(draft.speciesId)
  const set = (patch: Partial<Encounter>) => setDraft((d) => ({ ...d, ...patch }))

  async function save() {
    await saveEncounter({ ...draft, nickname: draft.nickname?.trim() || undefined })
    onClose()
  }

  async function move() {
    await saveEncounter(draft)
    await moveTo(draft, draft.status === 'party' ? 'box' : 'party')
    onClose()
  }

  return (
    <>
    {crowning && (
      <AceCrowning speciesId={draft.speciesId} shiny={draft.shiny} name={displayName(draft)} style={style} onDone={() => setCrowning(false)} />
    )}
    <Sheet
      title={
        <span className="flex items-center gap-1.5">
          {isAce && <span className="ace-crown">👑</span>}
          <bdi>{displayName(draft)}</bdi>
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <Button tone="danger" onClick={onDeath}>
            💀 {t('died')}
          </Button>
          <Button tone="soft" onClick={move} disabled={draft.status === 'box' && partyCount >= 6}>
            {draft.status === 'party' ? t('sendToBox') : t('sendToParty')}
          </Button>
          <Button className="flex-1" onClick={save}>
            {t('save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {species && !evolving && (
          <div className="flex items-center gap-3">
            <Sprite id={species.id} style={style} size={84} shiny={draft.shiny} />
            <div className="flex-1">
              <div className="font-bold">{species.name}</div>
              <div className="text-sm text-text-dim">{t('caughtAt', { location: draft.location })}</div>
              <button
                type="button"
                onClick={async () => {
                  await setAce(run, isAce ? undefined : encounter.id)
                  if (!isAce) setCrowning(true)
                }}
                className={`mt-1 me-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                  isAce ? 'bg-[#ffcb05]/25 text-[#9a7400]' : 'bg-surface-hi text-text'
                }`}
              >
                👑 {isAce ? t('isAce') : t('makeAce')}
                {isAce && <span className="text-xs font-normal opacity-70">· {t('removeAce')}</span>}
              </button>
              {evolutionFamily(species).length > 1 && (
                <button type="button" onClick={() => setEvolving(true)} className="mt-1 text-sm font-semibold text-primary">
                  ✦ {t('evolve')}
                </button>
              )}
            </div>
          </div>
        )}
        {species && evolving && (
          <SpeciesPicker
            value={draft.speciesId}
            onChange={(id) => {
              set({ speciesId: id, ability: undefined })
              setEvolving(false)
            }}
            style={style}
            only={evolutionFamily(species)}
            startOpen
          />
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label>{t('nickname')}</Label>
            <input className="field" value={draft.nickname ?? ''} onChange={(e) => set({ nickname: e.target.value })} maxLength={24} />
          </div>
          <div>
            <Label>{t('level')}</Label>
            <input
              className="field"
              inputMode="numeric"
              value={draft.level ?? ''}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 3)
                set({ level: v ? Number(v) : undefined })
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t('nature')}</Label>
            <select className="field" value={draft.nature ?? ''} onChange={(e) => set({ nature: e.target.value || undefined })}>
              <option value="">—</option>
              {NATURES.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t('ability')}</Label>
            <select className="field" value={draft.ability ?? ''} onChange={(e) => set({ ability: e.target.value || undefined })}>
              <option value="">—</option>
              {species?.abilities.map((a) => (
                <option key={a} value={a}>
                  {prettyAbility(a)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label>{t('gender')}</Label>
          <Segmented
            value={draft.gender ?? ''}
            onChange={(g) => set({ gender: g || undefined })}
            options={[
              { value: '', label: '—' },
              { value: 'm', label: `♂ ${t('male')}` },
              { value: 'f', label: `♀ ${t('female')}` },
            ]}
          />
        </div>
        <Toggle checked={!!draft.shiny} onChange={(v) => set({ shiny: v || undefined })} label={`✨ ${t('shiny')}`} />

        <MovesEditor
          moves={draft.moves ?? []}
          gen={style.gen}
          speciesId={draft.speciesId}
          versionGroup={run.customGame ? undefined : getGame(run.gameId)?.learnset}
          level={draft.level}
          onChange={(moves) => set({ moves: moves.length ? moves : undefined })}
        />

        <div>
          <Label>{t('notes')}</Label>
          <textarea
            className="field min-h-24"
            value={draft.notes ?? ''}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder={t('notesPlaceholder')}
          />
        </div>
      </div>
    </Sheet>
    </>
  )
}
