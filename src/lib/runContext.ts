import { useOutletContext } from 'react-router-dom'
import type { GameData } from '../data/gameData'
import type { Encounter, Run } from '../db/types'

export interface RunContext {
  run: Run
  encounters: Encounter[]
  /** Routes and bosses for the run's game; null for custom games / games without data. */
  data: GameData | null
}

/** The current run, provided by Layout to every run screen. */
export const useRun = () => useOutletContext<RunContext>()
