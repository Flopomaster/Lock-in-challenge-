import type { Boss, GameData } from '../data/gameData'
import { GEN_MAX_DEX, getGame } from '../data/games'
import { getSpecies } from '../data/pokedex'
import { db } from './db'
import type { Death, Encounter, EncounterStatus, Run } from './types'

export function runLocations(run: Run, data: GameData | null): string[] {
  const base = run.customGame
    ? run.customGame.locations
    : data
      ? data.locations.map((l) => l.n)
      : (getGame(run.gameId)?.locations ?? [])
  const all = [...base, ...run.extraLocations]
  return [...new Set(all)]
}

export const runGameName = (run: Run) => run.customGame?.name ?? getGame(run.gameId)?.name ?? run.gameId

export const runMaxBadges = (run: Run) => (run.customGame ? 8 : (getGame(run.gameId)?.badges ?? 8))

export const displayName = (e: Encounter) => e.nickname || getSpecies(e.speciesId)?.name || '???'

/**
 * Older runs logged the starter at a "Starter" pseudo-location; move it to the place the
 * starter is actually received (when that place is still free).
 */
export async function migrateStarterLocation(encounters: Encounter[], data: GameData) {
  // Place names fixed in later data builds (typos in the source data).
  for (const [from, to] of Object.entries(RENAMED_LOCATIONS)) {
    const e = encounters.find((x) => x.location === from)
    if (e && !encounters.some((x) => x.location === to)) await db.encounters.update(e.id!, { location: to })
  }
  const old = encounters.find((e) => e.location === 'Starter')
  const home = data.locations.find((l) => data.starters.length && data.starters.every((s) => l.e.includes(s)))?.n
  if (!old || !home || encounters.some((e) => e.location === home)) return
  await db.encounters.update(old.id!, { location: home })
}

const RENAMED_LOCATIONS: Record<string, string> = { 'Routes 219': 'Route 219' }

export async function toggleBossDefeated(run: Run, boss: Boss) {
  const defeated = new Set(run.defeatedBosses ?? [])
  const beaten = !defeated.has(boss.id)
  if (beaten) defeated.add(boss.id)
  else defeated.delete(boss.id)
  await db.runs.update(run.id!, { defeatedBosses: [...defeated] })
  // Journal: record the win (or take it back when unmarked).
  await db.journal.where({ runId: run.id!, bossId: boss.id }).delete()
  if (beaten)
    await db.journal.add({ runId: run.id!, at: Date.now(), kind: 'boss', bossId: boss.id, bossName: boss.name, gym: boss.type === 'gym-leader' })
}

/** Crowns a Pokémon as the run's ace (or takes the crown away with `undefined`), noting it in the journal. */
export async function setAce(run: Run, encounterId: number | undefined) {
  await db.runs.update(run.id!, { aceId: encounterId })
  if (encounterId !== undefined) await db.journal.add({ runId: run.id!, at: Date.now(), kind: 'ace', encounterId })
}

export async function createRun(run: Omit<Run, 'id'>): Promise<number> {
  return (await db.runs.add(run as Run)) as number
}

export function updateRun(id: number, patch: Partial<Run>) {
  return db.runs.update(id, patch)
}

export function deleteRun(id: number) {
  return db.transaction('rw', db.runs, db.encounters, db.journal, async () => {
    await db.encounters.where('runId').equals(id).delete()
    await db.journal.where('runId').equals(id).delete()
    await db.runs.delete(id)
  })
}

async function nextOrder(runId: number, status: EncounterStatus) {
  const list = await db.encounters.where({ runId }).filter((e) => e.status === status).toArray()
  return list.reduce((max, e) => Math.max(max, e.order), -1) + 1
}

export async function saveEncounter(enc: Encounter): Promise<void> {
  if (enc.id) {
    const prev = await db.encounters.get(enc.id)
    // Journal: a species change within the same family is an evolution (a different family is a correction).
    const before = getSpecies(prev?.speciesId)
    const after = getSpecies(enc.speciesId)
    if (prev && prev.status !== 'missed' && before && after && before.id !== after.id && before.chain === after.chain)
      await db.journal.add({ runId: enc.runId, at: Date.now(), kind: 'evolve', encounterId: enc.id, from: before.id, to: after.id })
    if (prev && prev.status !== enc.status) enc = { ...enc, order: await nextOrder(enc.runId, enc.status) }
    await db.encounters.put(enc)
  } else {
    await db.encounters.add({ ...enc, order: await nextOrder(enc.runId, enc.status) })
  }
}

export async function moveTo(enc: Encounter, status: EncounterStatus, death?: Death) {
  await db.encounters.update(enc.id!, {
    status,
    order: await nextOrder(enc.runId, status),
    death: status === 'dead' ? death : undefined,
  })
}

export async function deleteEncounter(id: number) {
  await db.journal.where({ encounterId: id }).delete()
  await db.encounters.delete(id)
}

/** Dupes Clause: an already-caught Pokémon (alive or dead) from the same evolution family. */
export function findDupe(encounters: Encounter[], speciesId: number, excludeId?: number): Encounter | undefined {
  const chain = getSpecies(speciesId)?.chain
  return encounters.find(
    (e) => e.id !== excludeId && e.status !== 'missed' && e.speciesId && getSpecies(e.speciesId)?.chain === chain,
  )
}

/** Highest dex number catchable in the run's game (ROM hacks / custom games allow everything). */
export function runMaxDex(run: Run): number {
  const game = getGame(run.gameId)
  if (run.customGame || !game || game.hack) return GEN_MAX_DEX[9]
  return GEN_MAX_DEX[game.gen]
}
