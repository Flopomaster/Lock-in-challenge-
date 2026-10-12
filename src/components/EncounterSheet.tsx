import { useState } from 'react'
import { deleteEncounter, displayName, findDupe, runMaxDex, saveEncounter } from '../db/repository'
import type { Encounter, EncounterStatus, Run } from '../db/types'
import { playCatchSound } from '../lib/sound'
import { useSettings, useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'
import Sheet from './Sheet'
import SpeciesPicker from './SpeciesPicker'
import Sprite from './Sprite'
import { Button, Label, Segmented, Toggle, Warning } from './ui'

interface Props {
  run: Run
  location: string
  existing?: Encounter
  encounters: Encounter[]
  /** Species that can be found at this location, when the game's data knows. */
  options?: number[]
  onClose: () => void
}

export default function EncounterSheet({ run, location, existing, encounters, options, onClose }: Props) {
  const t = useT()
  const { sound } = useSettings()
  const style = spriteStyleForRun(run)
  const partyCount = encounters.filter((e) => e.status === 'party' && e.id !== existing?.id).length

  const [speciesId, setSpeciesId] = useState(existing?.speciesId)
  const [status, setStatus] = useState<EncounterStatus>(existing?.status ?? (partyCount >= 6 ? 'box' : 'party'))
  const [nickname, setNickname] = useState(existing?.nickname ?? '')
  const [level, setLevel] = useState(existing?.level?.toString() ?? '')
  const [shiny, setShiny] = useState(existing?.shiny ?? false)
  const [gender, setGender] = useState<'m' | 'f' | ''>(existing?.gender ?? '')

  const caught = status !== 'missed'
  const dupe = speciesId && run.rules.dupes ? findDupe(encounters, speciesId, existing?.id) : undefined

  async function save() {
    await saveEncounter({
      ...existing,
      runId: run.id!,
      location,
      speciesId,
      status,
      nickname: caught ? nickname.trim() || undefined : undefined,
      level: level ? Number(level) : undefined,
      shiny: shiny || undefined,
      gender: gender || undefined,
      order: existing?.order ?? 0,
      createdAt: existing?.createdAt ?? Date.now(),
    })
    if (!existing && caught && sound) playCatchSound()
    onClose()
  }

  async function remove() {
    if (existing?.id && confirm(t('removeEncounterConfirm'))) {
      await deleteEncounter(existing.id)
      onClose()
    }
  }

  return (
    <Sheet
      title={t('encounterAt', { location })}
      onClose={onClose}
      footer={
        <>
          {existing && (
            <Button tone="danger" onClick={remove}>
              {t('delete')}
            </Button>
          )}
          <Button className="flex-1" onClick={save} disabled={caught && !speciesId}>
            {t('save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {options && options.length > 0 && (
          <div>
            <Label>{t('possibleEncounters')}</Label>
            <div className="flex flex-wrap gap-1">
              {options.map((id) => {
                const isDupe = run.rules.dupes && !!findDupe(encounters, id, existing?.id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSpeciesId(id)}
                    className={`relative rounded-xl border p-0.5 transition ${id === speciesId ? 'border-primary bg-primary-bg' : 'border-transparent bg-surface-hi'} ${isDupe ? 'opacity-40' : ''}`}
                  >
                    <Sprite id={id} style={style} size={44} />
                    {isDupe && (
                      <span className="absolute -bottom-1 start-1/2 -translate-x-1/2 rounded bg-warn px-1 text-[8px] font-bold uppercase text-white rtl:translate-x-1/2">
                        {t('dupe')}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <Label>{t('pokemon')}</Label>
          <SpeciesPicker
            key={speciesId}
            value={speciesId}
            onChange={setSpeciesId}
            style={style}
            maxDex={runMaxDex(run)}
            allowUnknown={!caught}
            autoFocus={!options?.length}
          />
        </div>

        {dupe && (
          <Warning>
            {shiny && run.rules.shiny
              ? t('warnDupeShiny')
              : t('warnDupe', { name: displayName(dupe), location: dupe.location })}
          </Warning>
        )}

        {existing?.status === 'dead' ? (
          <div className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-semibold text-danger">{t('statusDead')}</div>
        ) : (
          <div>
            <Label>{t('outcome')}</Label>
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { value: 'party', label: t('outcomeCaughtParty') },
                { value: 'box', label: t('outcomeCaughtBox') },
                { value: 'missed', label: t('outcomeMissed') },
              ]}
            />
          </div>
        )}
        {status === 'party' && partyCount >= 6 && <Warning>{t('warnPartyFull')}</Warning>}

        {caught && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>{t('nickname')}</Label>
                <input className="field" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={24} />
              </div>
              <div>
                <Label>{t('level')}</Label>
                <input className="field" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value.replace(/\D/g, '').slice(0, 3))} />
              </div>
            </div>
            {run.rules.nicknames && !nickname.trim() && <Warning>{t('warnNickname')}</Warning>}
            <div>
              <Label>{t('gender')}</Label>
              <Segmented
                value={gender}
                onChange={setGender}
                options={[
                  { value: '', label: '—' },
                  { value: 'm', label: `♂ ${t('male')}` },
                  { value: 'f', label: `♀ ${t('female')}` },
                ]}
              />
            </div>
            <Toggle checked={shiny} onChange={setShiny} label={`✨ ${t('shiny')}`} />
          </>
        )}
      </div>
    </Sheet>
  )
}
