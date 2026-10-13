import BossCard from '../components/BossCard'
import { isListedBoss, starterType } from '../lib/bosses'
import { useRun } from '../lib/runContext'
import { useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'

export default function Bosses() {
  const t = useT()
  const { run, encounters, data } = useRun()
  const style = spriteStyleForRun(run)
  const starter = starterType(encounters, style.gen, data)

  const bosses = (data?.bosses ?? []).filter(isListedBoss)
  const firstOpen = bosses.find((b) => !run.defeatedBosses?.includes(b.id))?.id

  return (
    <div className="space-y-3">
      {bosses.map((b) => (
        <BossCard key={b.id} boss={b} run={run} starter={starter} style={style} defaultOpen={b.id === firstOpen} />
      ))}
      <p className="pt-2 text-center text-xs text-text-dim">{t('bossDataCredit')}</p>
    </div>
  )
}
