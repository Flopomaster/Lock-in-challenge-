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

/** Replaces all data with the backup's. Throws if the file isn't a valid backup. */
export async function importBackup(file: File): Promise<{ runs: number; mons: number }> {
  const data = JSON.parse(await file.text()) as Backup
  if (data?.app !== 'nuzlocke-tracker' || !Array.isArray(data.runs) || !Array.isArray(data.encounters)) {
    throw new Error('invalid backup')
  }
  await db.transaction('rw', db.runs, db.encounters, async () => {
    await db.runs.clear()
    await db.encounters.clear()
    await db.runs.bulkAdd(data.runs)
    await db.encounters.bulkAdd(data.encounters)
  })
  return { runs: data.runs.length, mons: data.encounters.filter((e) => e.status !== 'missed').length }
}
