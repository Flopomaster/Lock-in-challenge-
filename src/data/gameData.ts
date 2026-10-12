import { useEffect, useState } from 'react'

export interface BossMon {
  /** Species (national dex) id; absent for fakemon. */
  s?: number
  /** Form's PokeAPI pokemon id (sprite) and types, for regional/alt forms. */
  f?: number
  ty?: string[]
  /** Name for unresolved (fakemon) entries. */
  n?: string
  l: number
  m?: string[]
  a?: string
  i?: string
  /** Only present when the player picked a starter of this type (rival teams). */
  st?: string
  /** Tera type. */
  tt?: string
}

export type BossType = 'gym-leader' | 'elite-four' | 'rival' | 'evil-team' | 'mini-boss' | 'titan'

export interface Boss {
  id: string
  name: string
  type: BossType
  loc: string
  /** Index in `locations` the battle comes after. */
  after: number
  spec?: string
  double?: boolean
  team: BossMon[]
}

export interface GameData {
  locations: { n: string; e: number[] }[]
  bosses: Boss[]
}

const FILES = import.meta.glob<GameData>('./games/*.json', { import: 'default' })
const cache = new Map<string, GameData | null>()

export function loadGameData(gameId: string): Promise<GameData | null> {
  if (cache.has(gameId)) return Promise.resolve(cache.get(gameId)!)
  const loader = FILES[`./games/${gameId}.json`]
  if (!loader) {
    cache.set(gameId, null)
    return Promise.resolve(null)
  }
  return loader().then((d) => {
    cache.set(gameId, d)
    return d
  })
}

/** `undefined` while loading, `null` when the game has no generated data (custom games, LGPE). */
export function useGameData(gameId: string | undefined): GameData | null | undefined {
  const [state, setState] = useState<{ id?: string; data?: GameData | null }>({})
  useEffect(() => {
    if (!gameId) return
    let alive = true
    void loadGameData(gameId).then((data) => alive && setState({ id: gameId, data }))
    return () => {
      alive = false
    }
  }, [gameId])
  if (!gameId) return null
  if (cache.has(gameId)) return cache.get(gameId)
  return state.id === gameId ? state.data : undefined
}
