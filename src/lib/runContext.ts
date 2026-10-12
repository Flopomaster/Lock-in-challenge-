import { useOutletContext } from 'react-router-dom'
import type { Encounter, Run } from '../db/types'

export interface RunContext {
  run: Run
  encounters: Encounter[]
}

/** The current run, provided by Layout to every run screen. */
export const useRun = () => useOutletContext<RunContext>()
