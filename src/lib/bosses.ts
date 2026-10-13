import type { Boss, BossMon, BossType, GameData } from '../data/gameData'
import { evolutionFamily, getSpecies, typesInGen } from '../data/pokedex'
import type { Encounter, Run } from '../db/types'
import type { StringKey } from '../i18n/strings'

export const BOSS_TYPE_LABELS: Record<BossType, StringKey> = {
  'gym-leader': 'bossGym',
  'elite-four': 'bossElite',
  rival: 'bossRival',
  'evil-team': 'bossEvil',
  'mini-boss': 'bossMini',
  titan: 'bossTitan',
}

/** Bosses that set level caps: gyms and the league. */
export const isMajorBoss = (b: Boss) => b.type === 'gym-leader' || b.type === 'elite-four'

/** Bosses listed in the Bosses tab: gyms, the league and rivals. */
export const isListedBoss = (b: Boss) => isMajorBoss(b) || b.type === 'rival'

const STARTER_TYPES = ['grass', 'fire', 'water']

/** The player's starter type (rival teams in the data are keyed by it): the caught Pokémon from a starter's family. */
export function starterType(encounters: Encounter[], gen: number, data: GameData | null): string | undefined {
  const starterChains = new Set((data?.starters ?? []).map((id) => getSpecies(id)?.chain))
  const starter = [...encounters]
    .sort((a, b) => a.createdAt - b.createdAt)
    .find((e) => e.status !== 'missed' && starterChains.has(getSpecies(e.speciesId)?.chain))
  const species = getSpecies(starter?.speciesId)
  if (!species) return undefined
  const base = evolutionFamily(species)[0]
  return typesInGen(base, gen).find((t) => STARTER_TYPES.includes(t))
}

/** The boss's team for the player's starter; rival entries for other starters are dropped. */
export function bossTeam(boss: Boss, starter: string | undefined): BossMon[] {
  if (!starter) return boss.team
  return boss.team.filter((m) => !m.st || m.st === starter)
}

export const levelCap = (boss: Boss, starter: string | undefined) => Math.max(0, ...bossTeam(boss, starter).map((m) => m.l))

export const isDefeated = (run: Run, boss: Boss) => !!run.defeatedBosses?.includes(boss.id)

export function nextBoss(run: Run, data: GameData | null): Boss | undefined {
  return data?.bosses.find((b) => isMajorBoss(b) && !isDefeated(run, b))
}

export function gymCount(data: GameData | null): number {
  return data?.bosses.filter((b) => b.type === 'gym-leader').length ?? 0
}

export const prettySlug = (slug: string) =>
  slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')

export function bossMonName(m: BossMon): string {
  return getSpecies(m.s)?.name ?? (m.n ? prettySlug(m.n) : '???')
}

export function bossMonTypes(m: BossMon, gen: number): string[] {
  if (m.ty) return m.ty
  const s = getSpecies(m.s)
  return s ? typesInGen(s, gen) : []
}
