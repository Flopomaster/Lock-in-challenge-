import { useState } from 'react'
import PokemonDetail from '../components/PokemonDetail'
import PokemonTile from '../components/PokemonTile'
import TypeMatchups from '../components/TypeMatchups'
import { Label } from '../components/ui'
import { byOrder } from '../db/hooks'
import type { Encounter } from '../db/types'
import { levelCap, nextBoss, starterType } from '../lib/bosses'
import { useRun } from '../lib/runContext'
import { useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'

export default function Team() {
  const t = useT()
  const { run, encounters, data } = useRun()
  const style = spriteStyleForRun(run)
  const [selectedId, setSelectedId] = useState<number>()
  const selected = encounters.find((e) => e.id === selectedId)

  const party = encounters.filter((e) => e.status === 'party').sort(byOrder)
  const box = encounters.filter((e) => e.status === 'box').sort(byOrder)
  const next = run.rules.levelCaps ? nextBoss(run, data) : undefined
  const cap = next ? levelCap(next, starterType(encounters, style.gen)) : Infinity

  const grid = (list: Encounter[]) => (
    <div className="grid grid-cols-3 gap-2.5">
      {list.map((e) => (
        <PokemonTile key={e.id} encounter={e} style={style} overCap={(e.level ?? 0) > cap} onClick={() => setSelectedId(e.id)} />
      ))}
    </div>
  )

  return (
    <div className="animate-rise-in space-y-5">
      <section>
        <Label>
          {t('party')} · {party.length}/6
        </Label>
        {party.length ? grid(party) : <div className="card p-5 text-center text-text-dim">{t('emptyParty')}</div>}
      </section>
      <section>
        <Label>
          {t('box')} · {box.length}
        </Label>
        {box.length ? grid(box) : <div className="card p-5 text-center text-text-dim">{t('boxEmpty')}</div>}
      </section>
      <TypeMatchups party={party} gen={style.gen} />
      {selected && (
        <PokemonDetail key={selected.id} run={run} encounter={selected} encounters={encounters} data={data} onClose={() => setSelectedId(undefined)} />
      )}
    </div>
  )
}
