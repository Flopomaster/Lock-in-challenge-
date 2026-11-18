import Dexie, { type EntityTable } from 'dexie'
import type { Encounter, HallOfFameEntry, JournalEvent, Run } from './types'

class NuzlockeDatabase extends Dexie {
  runs!: EntityTable<Run, 'id'>
  encounters!: EntityTable<Encounter, 'id'>
  hallOfFame!: EntityTable<HallOfFameEntry, 'id'>
  journal!: EntityTable<JournalEvent, 'id'>

  constructor() {
    super('nuzlocke-tracker')
    this.version(1).stores({
      runs: '++id, createdAt, status',
      encounters: '++id, runId, [runId+location], status',
    })
    this.version(2).stores({
      hallOfFame: '++id, enteredAt, runId',
    })
    this.version(3).stores({
      journal: '++id, runId, at, encounterId, [runId+bossId]',
    })
  }
}

export const db = new NuzlockeDatabase()
