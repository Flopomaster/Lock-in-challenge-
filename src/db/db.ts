import Dexie, { type EntityTable } from 'dexie'
import type { Encounter, Run } from './types'

class NuzlockeDatabase extends Dexie {
  runs!: EntityTable<Run, 'id'>
  encounters!: EntityTable<Encounter, 'id'>

  constructor() {
    super('nuzlocke-tracker')
    this.version(1).stores({
      runs: '++id, createdAt, status',
      encounters: '++id, runId, [runId+location], status',
    })
  }
}

export const db = new NuzlockeDatabase()
