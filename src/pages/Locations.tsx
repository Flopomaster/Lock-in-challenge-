import { useMemo, useState } from 'react'
import EncounterSheet from '../components/EncounterSheet'
import Sheet from '../components/Sheet'
import Sprite from '../components/Sprite'
import { IconPlus, IconSearch } from '../components/icons'
import { Button, Segmented } from '../components/ui'
import { getSpecies } from '../data/pokedex'
import { displayName, runLocations, updateRun } from '../db/repository'
import type { Encounter, EncounterStatus } from '../db/types'
import type { StringKey } from '../i18n/strings'
import { useRun } from '../lib/runContext'
import { useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'

const STATUS: Record<EncounterStatus, { label: StringKey; className: string }> = {
  party: { label: 'statusParty', className: 'bg-good-bg text-good' },
  box: { label: 'statusBox', className: 'bg-primary-bg text-primary' },
  dead: { label: 'statusDead', className: 'bg-danger-bg text-danger' },
  missed: { label: 'statusMissed', className: 'bg-surface-hi text-text-dim' },
}

type Filter = 'all' | 'todo' | 'done'

export default function Locations() {
  const t = useT()
  const { run, encounters, data } = useRun()
  const style = spriteStyleForRun(run)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string>()
  const [adding, setAdding] = useState(false)

  const byLocation = useMemo(() => new Map(encounters.map((e) => [e.location, e])), [encounters])
  const locations = useMemo(() => {
    // Keep encounters whose location was removed from the list visible too.
    const all = runLocations(run, data)
    for (const e of encounters) if (!all.includes(e.location)) all.push(e.location)
    const q = query.trim().toLowerCase()
    return all.filter((l) => {
      if (q && !l.toLowerCase().includes(q)) return false
      if (filter === 'todo') return !byLocation.has(l)
      if (filter === 'done') return byLocation.has(l)
      return true
    })
  }, [run, data, encounters, byLocation, filter, query])

  return (
    <div className="space-y-3">
      <div className="card flex items-center gap-2 px-3">
        <IconSearch size={18} className="text-text-dim" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchLocations')} className="w-full bg-transparent py-2.5 outline-none" />
      </div>
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('allLocations') },
          { value: 'todo', label: t('todo') },
          { value: 'done', label: t('done') },
        ]}
      />

      <ul className="space-y-2">
        {locations.map((loc) => {
          const enc = byLocation.get(loc)
          return (
            <li key={loc}>
              <button type="button" onClick={() => setOpen(loc)} className="card flex w-full items-center gap-3 px-3 py-2 text-start transition active:scale-[0.99]">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold" dir="ltr" style={{ textAlign: 'start' }}>
                    {loc}
                  </div>
                  {enc ? <EncounterLine enc={enc} /> : <div className="text-sm text-text-dim">{t('noEncounter')}</div>}
                </div>
                {enc ? (
                  <Sprite id={enc.speciesId} style={style} size={48} shiny={enc.shiny} dead={enc.status === 'dead' || enc.status === 'missed'} />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-bg text-primary">
                    <IconPlus size={20} />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <Button tone="soft" className="w-full" onClick={() => setAdding(true)}>
        <IconPlus size={18} />
        {t('addLocation')}
      </Button>

      {open && (
        <EncounterSheet
          run={run}
          location={open}
          existing={byLocation.get(open)}
          encounters={encounters}
          options={data?.locations.find((l) => l.n === open)?.e}
          onClose={() => setOpen(undefined)}
        />
      )}
      {adding && (
        <AddLocationSheet
          onClose={() => setAdding(false)}
          onAdd={(name) => updateRun(run.id!, { extraLocations: [...run.extraLocations, name] })}
          existing={runLocations(run, data)}
        />
      )}
    </div>
  )
}

function EncounterLine({ enc }: { enc: Encounter }) {
  const t = useT()
  const s = STATUS[enc.status]
  const species = getSpecies(enc.speciesId)
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`rounded-full px-2 py-px text-[11px] font-semibold ${s.className}`}>{t(s.label)}</span>
      <span className="truncate text-text-dim">
        <bdi>
          {species ? displayName(enc) : t('unknownPokemon')}
          {enc.nickname && species && ` (${species.name})`}
        </bdi>
      </span>
    </div>
  )
}

function AddLocationSheet({ onClose, onAdd, existing }: { onClose: () => void; onAdd: (name: string) => void; existing: string[] }) {
  const t = useT()
  const [name, setName] = useState('')
  const trimmed = name.trim()
  const valid = trimmed && !existing.includes(trimmed)
  return (
    <Sheet
      title={t('addLocation')}
      onClose={onClose}
      footer={
        <Button
          className="flex-1"
          disabled={!valid}
          onClick={() => {
            onAdd(trimmed)
            onClose()
          }}
        >
          {t('add')}
        </Button>
      }
    >
      <input autoFocus className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('newLocationName')} />
    </Sheet>
  )
}
