import { getMove, moveName } from '../data/moves'
import { TYPE_COLORS } from '../data/types'

/** A move pill tinted by its type; `highlight` rings it (e.g. super-effective). */
export default function MoveChip({ move, highlight, suffix }: { move: string; highlight?: boolean; suffix?: string }) {
  const m = getMove(move)
  const color = m ? TYPE_COLORS[m.t] : undefined
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${highlight ? 'ring-2 ring-danger' : ''}`}
      style={color ? { background: `${color}26`, borderInlineStart: `3px solid ${color}` } : undefined}
      dir="ltr"
    >
      {moveName(move)}
      {suffix && <b className="text-danger">{suffix}</b>}
    </span>
  )
}
