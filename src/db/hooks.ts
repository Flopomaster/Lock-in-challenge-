import { useLiveQuery } from 'dexie-react-hooks'
import { useSettings } from '../lib/settings'
import { db } from './db'
import type { Encounter, Run } from './types'

export interface CurrentRun {
  loading: boolean
  run?: Run
  encounters: Encounter[]
}

export function useCurrentRun(): CurrentRun {
  const { currentRunId } = useSettings()
  const data = useLiveQuery(async () => {
    if (!currentRunId) return { run: undefined, encounters: [] }
    const [run, encounters] = await Promise.all([
      db.runs.get(currentRunId),
      db.encounters.where({ runId: currentRunId }).toArray(),
    ])
    return { run, encounters }
  }, [currentRunId])
  return { loading: data === undefined, run: data?.run, encounters: data?.encounters ?? [] }
}

export const byOrder = (a: Encounter, b: Encounter) => a.order - b.order
