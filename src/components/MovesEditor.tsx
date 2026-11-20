import { useState } from 'react'
import { getMove, moveName, searchMoves } from '../data/moves'
import { TYPE_COLORS } from '../data/types'
import { useLearnset, type Learnset } from '../data/learnsets'
import { useT } from '../lib/settings'
import Sheet from './Sheet'
import { IconClose, IconPlus, IconSearch } from './icons'
import { Label } from './ui'

interface Props {
  moves: string[]
  gen: number
  /** The Pokémon and game, to offer the moves it can learn (PokeAPI version group). */
  speciesId?: number
  versionGroup?: string
  level?: number
  onChange: (m: string[]) => void
}

/** Four move slots; empty ones open a picker of the moves this Pokémon can learn in this game. */
export default function MovesEditor({ moves, gen, speciesId, versionGroup, level, onChange }: Props) {
  const t = useT()
  const learnset = useLearnset(versionGroup, speciesId)
  const [picking, setPicking] = useState<number>()
  const slots = [0, 1, 2, 3]

  return (
    <div>
      <Label>{t('movesLabel')}</Label>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((i) => {
          const move = moves[i]
          return move ? (
            <div key={i} className="flex items-center gap-1 rounded-xl bg-surface-hi py-1.5 pe-1 ps-2.5 text-sm font-medium">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TYPE_COLORS[getMove(move)?.t ?? ''] }} />
              <button type="button" className="min-w-0 flex-1 truncate text-start" dir="ltr" onClick={() => setPicking(i)}>
                {moveName(move)}
              </button>
              <button type="button" className="p-1 text-text-dim" aria-label="remove" onClick={() => onChange(moves.filter((_, j) => j !== i))}>
                <IconClose size={14} />
              </button>
            </div>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => setPicking(moves.length)}
              className="flex items-center justify-center gap-1 rounded-xl border border-dashed border-border py-1.5 text-sm text-text-dim"
            >
              <IconPlus size={14} />
              {t('addMove')}
            </button>
          )
        })}
      </div>
      {picking !== undefined && (
        <MovePicker
          gen={gen}
          learnset={learnset}
          level={level}
          exclude={moves}
          onClose={() => setPicking(undefined)}
          onPick={(m) => {
            const next = [...moves]
            next[Math.min(picking, moves.length)] = m
            onChange(next.slice(0, 4))
            setPicking(undefined)
          }}
        />
      )}
    </div>
  )
}

type Tab = 'levelUp' | 'machines' | 'tutor' | 'egg' | 'all'

interface PickerProps {
  gen: number
  /** Moves the species can learn in this game; null = unknown (offer every move of the generation). */
  learnset: Learnset | null | undefined
  level?: number
  exclude: string[]
  onPick: (m: string) => void
  onClose: () => void
}

/** Moves the Pokémon can actually learn, by how it learns them: level-up, TM/HM, tutor, egg — or all. */
function MovePicker({ gen, learnset, level, exclude, onPick, onClose }: PickerProps) {
  const t = useT()
  const [query, setQuery] = useState('')
  const tabs = (
    [
      ['levelUp', t('tabLevelUp'), learnset?.levelUp.length],
      ['machines', t('tabMachines'), learnset?.machines.length],
      ['tutor', t('tabTutor'), learnset?.tutor.length],
      ['egg', t('tabEgg'), learnset?.egg.length],
    ] as const
  ).filter(([, , n]) => n)
  const [tab, setTab] = useState<Tab>()
  const active: Tab = tab ?? (tabs[0]?.[0] || 'all')

  const q = query.toLowerCase().replace(/[^a-z0-9]/g, '')
  const matches = (move: string) => !exclude.includes(move) && (!q || move.replace(/-/g, '').includes(q))
  const rows: { move: string; tag?: string; later?: boolean }[] =
    active === 'levelUp'
      ? (learnset?.levelUp ?? []).map((m) => ({
          move: m.move,
          tag: m.level <= 1 ? t('learnStart') : t('learnsAt', { level: m.level }),
          later: level !== undefined && m.level > level,
        }))
      : active === 'machines'
        ? (learnset?.machines ?? []).map((m) => ({ move: m.move, tag: m.label }))
        : active === 'tutor'
          ? (learnset?.tutor ?? []).map((move) => ({ move }))
          : active === 'egg'
            ? (learnset?.egg ?? []).map((move) => ({ move }))
            : searchMoves(query, gen, 80).map((m) => ({ move: m.n }))
  // A move can be learned at several levels; list it once, at the first.
  const seen = new Set<string>()
  const visible = rows.filter((r) => matches(r.move) && !seen.has(r.move) && seen.add(r.move))

  return (
    <Sheet title={t('addMove')} onClose={onClose}>
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-surface-hi px-3">
        <IconSearch size={18} className="text-text-dim" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchMove')} className="w-full bg-transparent py-2.5 outline-none" dir="ltr" />
      </div>
      <div className="no-scrollbar -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1">
        {[...tabs.map(([id, label]) => [id, label] as const), ['all', t('tabAll')] as const].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${active === id ? 'bg-primary text-primary-ink' : 'bg-surface-hi text-text-dim'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {learnset === null && <p className="mb-2 text-xs text-text-dim">{t('noLearnset')}</p>}
      <div className="space-y-1">
        {visible.map(({ move, tag, later }) => {
          const m = getMove(move)
          return (
            <button
              key={move}
              type="button"
              onClick={() => onPick(move)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start hover:bg-surface-hi ${later ? 'opacity-50' : ''}`}
            >
              <span className="w-16 shrink-0 rounded-full py-0.5 text-center text-[10px] font-semibold uppercase text-white" style={{ background: TYPE_COLORS[m?.t ?? ''] ?? '#888' }}>
                {m?.t ?? '?'}
              </span>
              <span className="flex-1 font-medium" dir="ltr" style={{ textAlign: 'start' }}>
                {moveName(move)}
              </span>
              {tag && <span className="shrink-0 rounded-md bg-surface-hi px-1.5 text-[11px] font-semibold tabular-nums text-text-dim">{tag}</span>}
              <span className="w-7 text-end text-xs tabular-nums text-text-dim">{!m || m.c === 'x' ? '—' : (m.p ?? '?')}</span>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
