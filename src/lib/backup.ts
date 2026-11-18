import { db } from '../db/db'
import type { Encounter, HallOfFameEntry, JournalEvent, Run } from '../db/types'

interface Backup {
  app: 'nuzlocke-tracker'
  version: 1
  exportedAt: string
  runs: Run[]
  encounters: Encounter[]
  hallOfFame?: HallOfFameEntry[]
  journal?: JournalEvent[]
}

export async function exportBackup() {
  const backup: Backup = {
    app: 'nuzlocke-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    runs: await db.runs.toArray(),
    encounters: await db.encounters.toArray(),
    hallOfFame: await db.hallOfFame.toArray(),
    journal: await db.journal.toArray(),
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nuzlocke-backup-${backup.exportedAt.slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Imports a backup file. `replace` wipes current data first; `add` keeps it and appends the file's
 * runs under new ids. Throws if the file isn't a valid backup.
 */
export async function importBackup(file: File, mode: 'replace' | 'add'): Promise<{ runs: number; mons: number; firstRunId?: number }> {
  const data = JSON.parse(await file.text()) as Backup
  if (data?.app !== 'nuzlocke-tracker' || !Array.isArray(data.runs) || !Array.isArray(data.encounters)) {
    throw new Error('invalid backup')
  }
  let firstRunId: number | undefined
  await db.transaction('rw', [db.runs, db.encounters, db.hallOfFame, db.journal], async () => {
    if (mode === 'replace') {
      await db.runs.clear()
      await db.encounters.clear()
      await db.hallOfFame.clear()
      await db.journal.clear()
      await db.runs.bulkAdd(data.runs)
      await db.encounters.bulkAdd(data.encounters)
      await db.hallOfFame.bulkAdd(data.hallOfFame ?? [])
      await db.journal.bulkAdd(data.journal ?? [])
      firstRunId = data.runs[0]?.id
      return
    }
    const newIds = new Map<number | undefined, number>()
    for (const { id, ...run } of data.runs) {
      const newId = (await db.runs.add(run as Run)) as number
      newIds.set(id, newId)
      firstRunId ??= newId
    }
    // Encounters get new ids too; keep a map so journal entries still point at the right Pokémon.
    const newEncounterIds = new Map<number | undefined, number>()
    for (const { id, ...e } of data.encounters.filter((x) => newIds.has(x.runId))) {
      newEncounterIds.set(id, (await db.encounters.add({ ...e, runId: newIds.get(e.runId)! } as Encounter)) as number)
    }
    for (const run of data.runs)
      if (run.aceId !== undefined) await db.runs.update(newIds.get(run.id)!, { aceId: newEncounterIds.get(run.aceId) })
    await db.journal.bulkAdd(
      (data.journal ?? [])
        .filter((j) => newIds.has(j.runId))
        .map(({ id: _id, ...j }) => ({ ...j, runId: newIds.get(j.runId)!, encounterId: newEncounterIds.get(j.encounterId) }) as JournalEvent),
    )
    await db.hallOfFame.bulkAdd(
      (data.hallOfFame ?? []).map(({ id: _id, ...h }) => ({ ...h, runId: newIds.get(h.runId) }) as HallOfFameEntry),
    )
  })
  return { runs: data.runs.length, mons: data.encounters.filter((e) => e.status !== 'missed').length, firstRunId }
}
