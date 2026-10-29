import { useState } from 'react'
import { getMove, moveName, searchMoves } from '../data/moves'
import { TYPE_COLORS } from '../data/types'
import { useT } from '../lib/settings'
import Sheet from './Sheet'
import { IconClose, IconPlus, IconSearch } from './icons'
import { Label } from './ui'

/** Four move slots; empty ones open a searchable picker limited to the game's generation. */
export default function MovesEditor({ moves, gen, onChange }: { moves: string[]; gen: number; onChange: (m: string[]) => void }) {
  const t = useT()
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

function MovePicker({ gen, exclude, onPick, onClose }: { gen: number; exclude: string[]; onPick: (m: string) => void; onClose: () => void }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const results = searchMoves(query, gen, 60).filter((m) => !exclude.includes(m.n))
  return (
    <Sheet title={t('addMove')} onClose={onClose}>
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-surface-hi px-3">
        <IconSearch size={18} className="text-text-dim" />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchMove')} className="w-full bg-transparent py-2.5 outline-none" dir="ltr" />
      </div>
      <div className="space-y-1">
        {results.map((m) => (
          <button key={m.n} type="button" onClick={() => onPick(m.n)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start hover:bg-surface-hi">
            <span className="w-16 shrink-0 rounded-full py-0.5 text-center text-[10px] font-semibold uppercase text-white" style={{ background: TYPE_COLORS[m.t] }}>
              {m.t}
            </span>
            <span className="flex-1 font-medium" dir="ltr" style={{ textAlign: 'start' }}>
              {moveName(m.n)}
            </span>
            <span className="text-xs tabular-nums text-text-dim">{m.c === 'x' ? '—' : (m.p ?? '?')}</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
