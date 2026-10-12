import { useState } from 'react'
import type { Encounter, Run } from '../db/types'
import DeathFlow from './DeathFlow'
import PokemonSheet from './PokemonSheet'

/** Opens a caught Pokémon's sheet, and its funeral if it dies. */
export default function PokemonDetail({ run, encounter, encounters, onClose }: { run: Run; encounter: Encounter; encounters: Encounter[]; onClose: () => void }) {
  const [dying, setDying] = useState(false)
  if (dying) return <DeathFlow run={run} encounter={encounter} onClose={onClose} />
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
