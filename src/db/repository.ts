import { GEN_MAX_DEX, getGame } from '../data/games'
import { getSpecies } from '../data/pokedex'
import { db } from './db'
import type { Death, Encounter, EncounterStatus, Run } from './types'

export function runLocations(run: Run): string[] {
  const base = run.customGame ? run.customGame.locations : (getGame(run.gameId)?.locations ?? [])
  const all = [...base, ...run.extraLocations]
  return [...new Set(all)]
}

export const runGameName = (run: Run) => run.customGame?.name ?? getGame(run.gameId)?.name ?? run.gameId

export const runMaxBadges = (run: Run) => (run.customGame ? 8 : (getGame(run.gameId)?.badges ?? 8))

export const displayName = (e: Encounter) => e.nickname || getSpecies(e.speciesId)?.name || '???'

export async function createRun(run: Omit<Run, 'id'>): Promise<number> {
  return (await db.runs.add(run as Run)) as number
}

export function updateRun(id: number, patch: Partial<Run>) {
  return db.runs.update(id, patch)
}

export function deleteRun(id: number) {
  return db.transaction('rw', db.runs, db.encounters, async () => {
    await db.encounters.where('runId').equals(id).delete()
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

export function deleteEncounter(id: number) {
  return db.encounters.delete(id)
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
  if (run.customGame) return GEN_MAX_DEX[9]
  return GEN_MAX_DEX[getGame(run.gameId)?.gen ?? 9]
}
