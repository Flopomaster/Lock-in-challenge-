import { db } from '../db/db'
import { runGameName } from '../db/repository'
import type { Encounter, HallOfFameEntry, Run } from '../db/types'
import { byOrder } from '../db/hooks'

/** Freezes the run's party into a Hall of Fame entry (once per run) and marks the run won. */
export async function induct(run: Run, encounters: Encounter[], trainer: string | undefined, badges: number): Promise<HallOfFameEntry> {
  const existing = await db.hallOfFame.where({ runId: run.id! }).first()
  if (existing) return existing
  const party = encounters.filter((e) => e.status === 'party').sort(byOrder)
  const entry: HallOfFameEntry = {
    runId: run.id,
    runName: run.name,
    gameId: run.gameId,
    gameName: runGameName(run),
    variant: run.variant,
    trainer: trainer || undefined,
    partnerName: run.partnerName,
    enteredAt: Date.now(),
    startedAt: run.createdAt,
    team: party.map((e) => ({ speciesId: e.speciesId, nickname: e.nickname, level: e.level, shiny: e.shiny, location: e.location })),
    stats: {
      caught: encounters.filter((e) => e.status !== 'missed').length,
      deaths: encounters.filter((e) => e.status === 'dead').length,
      badges,
    },
    fallen: encounters.filter((e) => e.status === 'dead').map((e) => ({ speciesId: e.speciesId, nickname: e.nickname })),
  }
  entry.id = (await db.hallOfFame.add(entry)) as number
  await db.runs.update(run.id!, { status: 'won', endedAt: entry.enteredAt })
  return entry
}
