import { useEffect, useState } from 'react'

interface LearnsetFile {
  /** Move slugs; the species entries index into this list. */
  moves: string[]
  /** Per species: level-up [move, level] pairs, and TM/HM, tutor and egg move lists. */
  species: Record<string, { l?: [number, number][]; m?: number[]; t?: number[]; e?: number[] }>
  /** Machine label per move index, e.g. "TM26", "HM03". */
  tm: Record<string, string>
}

export interface Learnset {
  levelUp: { move: string; level: number }[]
  machines: { move: string; label: string }[]
  tutor: string[]
  egg: string[]
}

const FILES = import.meta.glob<LearnsetFile>('./learnsets/*.json', { import: 'default' })
const cache = new Map<string, LearnsetFile | null>()

function load(vg: string): Promise<LearnsetFile | null> {
  if (cache.has(vg)) return Promise.resolve(cache.get(vg)!)
  const loader = FILES[`./learnsets/${vg}.json`]
  if (!loader) {
    cache.set(vg, null)
    return Promise.resolve(null)
  }
  return loader().then((f) => {
    cache.set(vg, f)
    return f
  })
}

/** Machine numbers sort as TM01 < TM02 < … < HM01 (TRs last). */
const machineOrder = (label: string) => ({ TM: 0, HM: 1, TR: 2 })[label.slice(0, 2) as 'TM'] * 1000 + Number(label.slice(2))

function decode(file: LearnsetFile, speciesId: number): Learnset | null {
  const entry = file.species[speciesId]
  if (!entry) return null
  const name = (i: number) => file.moves[i]
  return {
    levelUp: (entry.l ?? []).map(([i, level]) => ({ move: name(i), level })),
    machines: (entry.m ?? [])
      .map((i) => ({ move: name(i), label: file.tm[i] ?? 'TM' }))
      .sort((a, b) => machineOrder(a.label) - machineOrder(b.label)),
    tutor: (entry.t ?? []).map(name),
    egg: (entry.e ?? []).map(name),
  }
}

/**
 * The moves `speciesId` can learn in a game: `undefined` while loading, `null` when unknown
 * (custom games, species missing from the data).
 */
export function useLearnset(versionGroup: string | undefined, speciesId: number | undefined): Learnset | null | undefined {
  const [file, setFile] = useState<{ vg?: string; data?: LearnsetFile | null }>({})
  useEffect(() => {
    if (!versionGroup) return
    let alive = true
    void load(versionGroup).then((data) => alive && setFile({ vg: versionGroup, data }))
    return () => {
      alive = false
    }
  }, [versionGroup])
  if (!versionGroup || !speciesId) return null
  const data = cache.has(versionGroup) ? cache.get(versionGroup) : file.vg === versionGroup ? file.data : undefined
  if (data === undefined) return undefined
  return data ? decode(data, speciesId) : null
}
