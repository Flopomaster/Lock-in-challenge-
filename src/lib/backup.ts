import { db } from '../db/db'
import type { Encounter, Run } from '../db/types'

interface Backup {
  app: 'nuzlocke-tracker'
  version: 1
  exportedAt: string
  runs: Run[]
  encounters: Encounter[]
}

export async function exportBackup() {
  const backup: Backup = {
    app: 'nuzlocke-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    runs: await db.runs.toArray(),
    encounters: await db.encounters.toArray(),
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
  await db.transaction('rw', db.runs, db.encounters, async () => {
    if (mode === 'replace') {
      await db.runs.clear()
      await db.encounters.clear()
      await db.runs.bulkAdd(data.runs)
      await db.encounters.bulkAdd(data.encounters)
      firstRunId = data.runs[0]?.id
      return
    }
    const newIds = new Map<number | undefined, number>()
    for (const { id, ...run } of data.runs) {
      const newId = (await db.runs.add(run as Run)) as number
      newIds.set(id, newId)
      firstRunId ??= newId
    }
    await db.encounters.bulkAdd(
      data.encounters.filter((e) => newIds.has(e.runId)).map(({ id: _id, ...e }) => ({ ...e, runId: newIds.get(e.runId)! }) as Encounter),
    )
  })
  return { runs: data.runs.length, mons: data.encounters.filter((e) => e.status !== 'missed').length, firstRunId }
}
