import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HallOfFameCeremony from '../components/HallOfFameCeremony'
import type { HallOfFameEntry } from '../db/types'
import { isDefeated } from '../lib/bosses'
import { induct } from '../lib/hallOfFame'
import { useRun } from '../lib/runContext'
import { useSettings } from '../lib/settings'

/** Freezes the current run's team into the Hall of Fame and plays the ceremony. */
export default function Induct() {
  const navigate = useNavigate()
  const { playerName } = useSettings()
  const { run, encounters, data } = useRun()
  const [entry, setEntry] = useState<HallOfFameEntry>()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const gyms = data?.bosses.filter((b) => b.type === 'gym-leader') ?? []
    const badges = gyms.length ? gyms.filter((g) => isDefeated(run, g)).length : run.badges
    void induct(run, encounters, playerName, badges).then(setEntry)
  }, [run, encounters, data, playerName])

  return entry ? <HallOfFameCeremony entry={entry} onClose={() => navigate('/hall-of-fame', { replace: true })} /> : null
}
