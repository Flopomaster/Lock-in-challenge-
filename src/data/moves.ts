import raw from './moves.json'

export interface Move {
  /** PokeAPI slug, e.g. "rock-tomb". */
  n: string
  t: string
  /** Base power; null for status / variable-power moves. */
  p: number | null
  /** Category: physical, special or status. */
  c: 'p' | 's' | 'x'
  /** Generation the move was introduced in. */
  g: number
}

export const MOVES = raw as Move[]
const BY_SLUG = new Map(MOVES.map((m) => [m.n, m]))

export const getMove = (slug: string | undefined) => (slug ? BY_SLUG.get(slug) : undefined)

/** A move that deals damage (status moves and fixed-damage oddities don't count for coverage). */
export const isDamaging = (m: Move | undefined): m is Move => !!m && m.c !== 'x' && (m.p ?? 0) > 1

export const moveName = (slug: string) =>
  slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')

export function searchMoves(query: string, gen: number, limit = 40): Move[] {
  const q = query.toLowerCase().replace(/[^a-z0-9]/g, '')
  const pool = MOVES.filter((m) => m.g <= gen)
  if (!q) return pool.slice(0, limit)
  const key = (m: Move) => m.n.replace(/-/g, '')
  return [...pool.filter((m) => key(m).startsWith(q)), ...pool.filter((m) => !key(m).startsWith(q) && key(m).includes(q))].slice(0, limit)
}
