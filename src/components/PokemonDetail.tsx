import { useState } from 'react'
import type { GameData } from '../data/gameData'
import type { Encounter, Run } from '../db/types'
import DeathFlow from './DeathFlow'
import PokemonSheet from './PokemonSheet'

/** Opens a caught Pokémon's sheet, and its funeral if it dies. */
interface Props {
  run: Run
  encounter: Encounter
  encounters: Encounter[]
  data: GameData | null
  onClose: () => void
}

export default function PokemonDetail({ run, encounter, encounters, data, onClose }: Props) {
  const [dying, setDying] = useState(false)
  if (dying) return <DeathFlow run={run} encounter={encounter} data={data} onClose={onClose} />
  return (
    <PokemonSheet
      run={run}
      encounter={encounter}
      partyCount={encounters.filter((e) => e.status === 'party').length}
      onClose={onClose}
      onDeath={() => setDying(true)}
    />
  )
}
