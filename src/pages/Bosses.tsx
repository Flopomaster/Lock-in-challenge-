import { useState } from 'react'
import BossCard from '../components/BossCard'
import { Segmented } from '../components/ui'
import { isMajorBoss, starterType } from '../lib/bosses'
import { useRun } from '../lib/runContext'
import { useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'

export default function Bosses() {
  const t = useT()
  const { run, encounters, data } = useRun()
  const style = spriteStyleForRun(run)
  const starter = starterType(encounters, style.gen)
  const [filter, setFilter] = useState<'main' | 'all'>('main')

  const bosses = (data?.bosses ?? []).filter((b) => filter === 'all' || isMajorBoss(b))
  const firstOpen = bosses.find((b) => !run.defeatedBosses?.includes(b.id))?.id

  return (
    <div className="space-y-3">
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'main', label: t('bossesMain') },
          { value: 'all', label: t('bossesAll') },
        ]}
      />
      {bosses.map((b) => (
        <BossCard key={b.id} boss={b} run={run} starter={starter} style={style} defaultOpen={b.id === firstOpen} />
      ))}
      <p className="pt-2 text-center text-xs text-text-dim">{t('bossDataCredit')}</p>
    </div>
  )
}
