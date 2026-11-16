import type { BossMon } from '../data/gameData'
import { getMove, isDamaging } from '../data/moves'
import { getSpecies, typesInGen } from '../data/pokedex'
import type { Encounter } from '../db/types'
import { bossMonTypes } from './bosses'
import { multiplier } from './typeChart'

export interface Offense {
  /** Type multiplier of the best hit. */
  x: number
  /** The move used; absent when judged from the attacker's own types (no moves logged). */
  move?: string
  type: string
}

export interface Defense {
  /** Worst multiplier the opponent can hit this Pokémon for. */
  x: number
  /** The opponent's move responsible; absent when judged from its types (no moves known). */
  move?: string
  type?: string
}

export interface Answer {
  encounter: Encounter
  offense: Offense
  defense: Defense
  /** Our level minus theirs. */
  levelGap: number
  score: number
}

const log2 = (x: number) => (x === 0 ? -3 : Math.log2(x))

/**
 * Our Pokémon's ability for matchups: the one logged, else the species' only ability. (With more
 * than one possible ability we can't know which it has, so none is assumed.)
 */
export function encounterAbility(e: Encounter): string | undefined {
  if (e.ability) return e.ability
  const abilities = getSpecies(e.speciesId)?.abilities ?? []
  return abilities.length === 1 ? abilities[0] : undefined
}

/** Best way for `attackerTypes` (with optional known moves) to hit `defenderTypes`. */
export function bestOffense(
  attackerTypes: string[],
  moves: string[] | undefined,
  defenderTypes: string[],
  gen: number,
  defenderAbility?: string,
): Offense {
  const known = (moves ?? []).map(getMove).filter(isDamaging)
  if (known.length) {
    const scored = known.map((m) => {
      const x = multiplier(m.t, defenderTypes, gen, defenderAbility)
      const stab = attackerTypes.includes(m.t) ? 1.5 : 1
      return { x, move: m.n, type: m.t, value: x * stab * (m.p ?? 60) }
    })
    const best = scored.sort((a, b) => b.value - a.value)[0]
    return { x: best.x, move: best.move, type: best.type }
  }
  const byType = attackerTypes.map((t) => ({ x: multiplier(t, defenderTypes, gen, defenderAbility), type: t })).sort((a, b) => b.x - a.x)
  return byType[0] ?? { x: 1, type: 'normal' }
}

/** The opponent's most dangerous hit on `defenderTypes`, from its known moves or else its types. */
export function worstDefense(
  opponentTypes: string[],
  opponentMoves: string[] | undefined,
  defenderTypes: string[],
  gen: number,
  defenderAbility?: string,
): Defense {
  const known = (opponentMoves ?? []).map(getMove).filter(isDamaging)
  const options = known.length
    ? known.map((m) => ({ x: multiplier(m.t, defenderTypes, gen, defenderAbility), move: m.n, type: m.t }))
    : opponentTypes.map((t) => ({ x: multiplier(t, defenderTypes, gen, defenderAbility), type: t }))
  return options.sort((a, b) => b.x - a.x)[0] ?? { x: 1 }
}

/** Ranks our Pokémon as answers to one boss Pokémon: hit it hard, take little back, be close in level. */
export function rankAnswers(boss: BossMon, ours: Encounter[], gen: number): Answer[] {
  const bossTypes = bossMonTypes(boss, gen)
  return ours
    .map((e) => {
      const species = getSpecies(e.speciesId)
      const types = species ? typesInGen(species, gen) : []
      const offense = bestOffense(types, e.moves, bossTypes, gen, boss.a)
      const defense = worstDefense(bossTypes, boss.m, types, gen, encounterAbility(e))
      const levelGap = (e.level ?? boss.l) - boss.l
      const score = log2(offense.x) * 1.2 - log2(defense.x) + Math.max(-2, Math.min(2, levelGap / 5))
      return { encounter: e, offense, defense, levelGap, score }
    })
    .sort((a, b) => b.score - a.score)
}

/** Boss Pokémon nobody in `ours` can hit super-effectively with a logged move (only when moves are logged). */
export function uncovered(team: BossMon[], ours: Encounter[], gen: number): BossMon[] {
  if (!ours.some((e) => e.moves?.length)) return []
  return team.filter((boss) => {
    const bossTypes = bossMonTypes(boss, gen)
    return !ours.some((e) => (e.moves ?? []).map(getMove).filter(isDamaging).some((m) => multiplier(m.t, bossTypes, gen, boss.a) > 1))
  })
}
