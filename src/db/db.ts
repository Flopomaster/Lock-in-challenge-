import Dexie, { type EntityTable } from 'dexie'
import type { Encounter, HallOfFameEntry, Run } from './types'

class NuzlockeDatabase extends Dexie {
  runs!: EntityTable<Run, 'id'>
  encounters!: EntityTable<Encounter, 'id'>
  hallOfFame!: EntityTable<HallOfFameEntry, 'id'>

  constructor() {
    super('nuzlocke-tracker')
    this.version(1).stores({
      runs: '++id, createdAt, status',
      encounters: '++id, runId, [runId+location], status',
    })
    this.version(2).stores({
      hallOfFame: '++id, enteredAt, runId',
    })
  }
}

export const db = new NuzlockeDatabase()
