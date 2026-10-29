import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { IconPlus, IconSkull, IconTrophy } from '../components/icons'
import { Button, Label } from '../components/ui'
import { db } from '../db/db'
import { deleteRun, runGameName, updateRun } from '../db/repository'
import type { Encounter, Run } from '../db/types'
import { VARIANT_LABELS } from '../lib/rules'
import { useSettings, useT } from '../lib/settings'

export default function Runs() {
  const t = useT()
  const navigate = useNavigate()
  const { currentRunId, update } = useSettings()
  const data = useLiveQuery(async () => {
    const [runs, encounters] = await Promise.all([db.runs.orderBy('createdAt').reverse().toArray(), db.encounters.toArray()])
    return { runs, encounters }
  })
  if (!data) return null

  const active = data.runs.filter((r) => r.status === 'active')
  const finished = data.runs.filter((r) => r.status !== 'active')

  const select = (id: number) => {
    update({ currentRunId: id })
    navigate('/')
  }

  // Winning a run inducts its team into the Hall of Fame, with the ceremony.
  const induct = (id: number) => {
    update({ currentRunId: id })
    navigate('/induct')
  }

  async function remove(run: Run) {
    if (!confirm(t('deleteRunConfirm', { name: run.name }))) return
    await deleteRun(run.id!)
    if (currentRunId === run.id) update({ currentRunId: undefined })
  }

  const card = (run: Run) => (
    <RunCard
      key={run.id}
      run={run}
      encounters={data.encounters.filter((e) => e.runId === run.id)}
      current={run.id === currentRunId}
      onSelect={() => select(run.id!)}
      onDelete={() => remove(run)}
      onWin={() => induct(run.id!)}
    />
  )

  return (
    <PageShell
      title={t('runs')}
      action={
        <>
          <button type="button" onClick={() => navigate('/hall-of-fame')} className="rounded-full p-2 text-xl" aria-label={t('hallOfFame')}>
            🏆
          </button>
          <button type="button" onClick={() => navigate('/stats')} className="rounded-full p-2 text-xl" aria-label={t('stats')}>
            📊
          </button>
          <Button className="!px-3 !py-1.5 text-sm" onClick={() => navigate('/runs/new')}>
          <IconPlus size={18} />
          {t('newRun')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {active.length > 0 && (
          <section className="space-y-2.5">
            <Label>{t('activeRuns')}</Label>
            {active.map(card)}
          </section>
        )}
        {finished.length > 0 && (
          <section className="space-y-2.5">
            <Label>{t('finishedRuns')}</Label>
            {finished.map(card)}
          </section>
        )}
        {data.runs.length === 0 && (
          <Button className="w-full" onClick={() => navigate('/runs/new')}>
            <IconPlus size={18} />
            {t('newRun')}
          </Button>
        )}
      </div>
    </PageShell>
  )
}

interface RunCardProps {
  run: Run
  encounters: Encounter[]
  current: boolean
  onSelect: () => void
  onDelete: () => void
  onWin: () => void
}

function RunCard({ run, encounters, current, onSelect, onDelete, onWin }: RunCardProps) {
  const t = useT()
  const alive = encounters.filter((e) => e.status === 'party' || e.status === 'box').length
  const dead = encounters.filter((e) => e.status === 'dead').length
  const setStatus = (status: Run['status']) => updateRun(run.id!, { status, endedAt: status === 'active' ? undefined : Date.now() })

  return (
    <div className={`card overflow-hidden ${current ? 'ring-2 ring-primary' : ''}`}>
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 p-4 text-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold">{run.name}</span>
            {current && <span className="rounded-full bg-primary-bg px-2 py-px text-[10px] font-bold text-primary">{t('current')}</span>}
          </div>
          <div className="text-sm text-text-dim">
            {runGameName(run)} · {t(VARIANT_LABELS[run.variant])}
            {run.partnerName && ` · 🔗 ${run.partnerName}`}
          </div>
          <div className="mt-1.5 flex gap-3 text-sm">
            <span className="text-good">● {alive} {t('alive')}</span>
            <span className="text-danger">● {dead} {t('dead')}</span>
            {run.badges > 0 && <span className="text-text-dim">🏅 {run.badges}</span>}
          </div>
        </div>
        {run.status === 'won' && <IconTrophy className="text-good" />}
        {run.status === 'lost' && <IconSkull className="text-danger" />}
      </button>
      <div className="flex border-t border-border text-sm">
        {run.status === 'active' ? (
          <>
            <button type="button" className="flex-1 py-2 text-good" onClick={onWin}>
              {t('markWon')}
            </button>
            <button type="button" className="flex-1 border-s border-border py-2 text-danger" onClick={() => setStatus('lost')}>
              {t('markLost')}
            </button>
          </>
        ) : (
          <button type="button" className="flex-1 py-2" onClick={() => setStatus('active')}>
            {t('reopenRun')}
          </button>
        )}
        <button type="button" className="border-s border-border px-4 py-2 text-text-dim" onClick={onDelete}>
          {t('delete')}
        </button>
      </div>
    </div>
  )
}
