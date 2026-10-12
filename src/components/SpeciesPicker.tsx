import { useMemo, useState } from 'react'
import { POKEDEX, getSpecies, searchSpecies, typesInGen, type Species } from '../data/pokedex'
import { useT } from '../lib/settings'
import type { SpriteStyle } from '../lib/sprites'
import Sprite from './Sprite'
import { IconSearch } from './icons'
import { TypeBadge } from './ui'

interface Props {
  value?: number
  onChange: (id: number | undefined) => void
  style: SpriteStyle
  maxDex?: number
  /** Limit choices to these species (e.g. an evolution family). */
  only?: Species[]
  allowUnknown?: boolean
}

export default function SpeciesPicker({ value, onChange, style, maxDex = POKEDEX.length, only, allowUnknown }: Props) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(!value)
  const selected = getSpecies(value)

  const results = useMemo(() => {
    if (only) {
      const q = query.trim().toLowerCase()
      return only.filter((s) => s.name.toLowerCase().includes(q))
    }
    return searchSpecies(query, maxDex)
  }, [query, maxDex, only])

  if (!open && selected) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-hi p-2 text-start">
        <Sprite id={selected.id} style={style} size={56} />
        <div className="flex-1">
          <div className="font-bold">{selected.name}</div>
          <div className="mt-1 flex gap-1">
            {typesInGen(selected, style.gen).map((ty) => (
              <TypeBadge key={ty} type={ty} />
            ))}
          </div>
        </div>
        <span className="text-xs text-text-dim">#{selected.id}</span>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface-hi">
      <div className="flex items-center gap-2 border-b border-border px-3">
        <IconSearch size={18} className="text-text-dim" />
        <input
          autoFocus={!only}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPokemon')}
          className="w-full bg-transparent py-2.5 outline-none"
        />
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {allowUnknown && !query && (
          <button
            type="button"
            onClick={() => {
              onChange(undefined)
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start text-text-dim hover:bg-surface"
          >
            <Sprite style={style} size={40} />
            {t('unknownPokemon')}
          </button>
        )}
        {results.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              onChange(s.id)
              setOpen(false)
              setQuery('')
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-2 py-1 text-start hover:bg-surface ${s.id === value ? 'bg-primary-bg' : ''}`}
          >
            <Sprite id={s.id} style={style} size={40} />
            <span className="flex-1 font-medium">{s.name}</span>
            <span className="flex gap-1">
              {typesInGen(s, style.gen).map((ty) => (
                <TypeBadge key={ty} type={ty} small />
              ))}
            </span>
            <span className="w-10 text-end text-xs text-text-dim">#{s.id}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
