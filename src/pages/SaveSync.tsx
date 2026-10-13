import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sprite from '../components/Sprite'
import { Button, Label } from '../components/ui'
import { getSpecies } from '../data/pokedex'
import { displayName, runLocations } from '../db/repository'
import type { Encounter } from '../db/types'
import { useRun } from '../lib/runContext'
import { diagnoseHgssSave, parseHgssSave, SaveError, type ParsedSave } from '../lib/saves/hgss'
import { applySync, planSync, type NewCatch, type SyncPlan } from '../lib/saves/sync'
import { useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'

export default function SaveSync() {
  const t = useT()
  const navigate = useNavigate()
  const { run, encounters, data } = useRun()
  const style = spriteStyleForRun(run)
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const [plan, setPlan] = useState<SyncPlan & { party: number; box: number }>()
  const [catches, setCatches] = useState(new Set<NewCatch>())
  const [missing, setMissing] = useState(new Set<Encounter>())
  const [busy, setBusy] = useState(false)
  const [choices, setChoices] = useState<ParsedSave[]>()
  const [games, setGames] = useState<ParsedSave[]>([])
  const [wrongGame, setWrongGame] = useState(new Set<Encounter>())
  const [report, setReport] = useState<string>()
  const [copied, setCopied] = useState(false)

  function choose(save: ParsedSave, all = games) {
    setChoices(undefined)
    const others = all.filter((g) => g !== save)
    const p = planSync(save, run, encounters, runLocations(run, data), data?.bosses ?? [], others)
    setPlan({ ...p, party: save.party.length, box: save.boxes.length })
    setCatches(new Set(p.newCatches.filter((c) => !c.taken)))
    setMissing(new Set())
    setWrongGame(new Set(p.wrongGame))
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setError(undefined)
    setPlan(undefined)
    setChoices(undefined)
    setCopied(false)
    const buffer = await file.arrayBuffer()
    try {
      setReport(diagnoseHgssSave(buffer))
    } catch (e) {
      setReport(`diagnose failed: ${(e as Error).message}`)
    }
    try {
      const found = parseHgssSave(buffer)
      setGames(found)
      const known = run.saveTrainer && found.find((g) => g.tid === run.saveTrainer!.tid && g.sid === run.saveTrainer!.sid)
      if (known) choose(known, found)
      else if (found.length === 1 && !run.saveTrainer) choose(found[0], found)
      else setChoices(found)
    } catch (e) {
      setError(e instanceof SaveError && e.message === 'size' ? t('saveErrorSize') : t('saveErrorFormat'))
    }
  }

  async function apply() {
    if (!plan) return
    setBusy(true)
    await applySync(run, plan, { newCatches: catches, missing, wrongGame })
    setBusy(false)
    navigate('/')
  }

  const toggle = <T,>(set: Set<T>, item: T, update: (s: Set<T>) => void) => {
    const next = new Set(set)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    update(next)
  }

  const visibleUpdates = plan?.updates.filter((u) => u.changes.length) ?? []
  const empty =
    plan && !plan.newCatches.length && !visibleUpdates.length && !plan.missing.length && !plan.newBadges.length && !plan.wrongGame.length

  return (
    <div className="animate-rise-in space-y-4">
      <div className="card space-y-3 p-4">
        <div className="font-bold">📥 {t('saveSync')}</div>
        <p className="text-sm text-text-dim">{t('saveSyncDesc')}</p>
        <p className="rounded-xl bg-surface-hi p-3 text-sm">{t('deltaSteps')}</p>
        <Button className="w-full" onClick={() => fileRef.current?.click()}>
          {t('chooseSave')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {error && <p className="text-sm font-semibold text-danger">{error}</p>}
      </div>

      {report && (
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-text-dim">🔧 {t('diagnostics')}</summary>
          <pre dir="ltr" className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-surface-hi p-2 text-[11px]">
            {report}
          </pre>
          <Button
            tone="soft"
            className="mt-2 w-full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(report)
                setCopied(true)
              } catch {
                prompt('', report)
              }
            }}
          >
            {copied ? '✓' : t('copyReport')}
          </Button>
        </details>
      )}

      {choices && (
        <section className="space-y-2.5">
          <p className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">{run.saveTrainer ? t('pickSaveGameOther') : t('pickSaveGame')}</p>
          {choices.map((g) => (
            <button key={`${g.tid}-${g.sid}`} type="button" onClick={() => choose(g)} className="card w-full p-3 text-start transition active:scale-[0.99]">
              <div className="font-bold">
                <bdi>{g.trainer}</bdi>
              </div>
              <div className="text-xs text-text-dim">{t('saveGameInfo', { tid: String(g.tid).padStart(5, '0'), badges: g.badges.length, count: g.party.length + g.boxes.length })}</div>
              <div className="mt-1 flex flex-wrap">
                {g.party.map((m) => (
                  <Sprite key={m.pid} id={m.speciesId} style={style} size={40} shiny={m.shiny} />
                ))}
              </div>
            </button>
          ))}
        </section>
      )}

      {plan && (
        <>
          <div className="text-center text-sm text-text-dim">{t('saveTrainer', { name: plan.trainer, party: plan.party, box: plan.box })}</div>
          {plan.fainted.length > 0 && (
            <div className="rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">
              {t('faintedNote', { names: plan.fainted.map((m) => m.nickname || getSpecies(m.speciesId)?.name).join(', ') })}
            </div>
          )}
          {empty && <div className="card p-4 text-center text-text-dim">{t('nothingToSync')}</div>}

          {plan.newCatches.length > 0 && (
            <section className="card p-4">
              <Label>{t('newCatches')}</Label>
              {plan.newCatches.some((c) => c.taken) && <p className="-mt-1 mb-2 text-xs text-text-dim">{t('newCatchesHint')}</p>}
              <div className="divide-y divide-border">
                {plan.newCatches.map((c) => (
                  <Row key={c.mon.pid} checked={catches.has(c)} onToggle={() => toggle(catches, c, setCatches)}>
                    <Sprite id={c.mon.speciesId} style={style} size={44} shiny={c.mon.shiny} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">
                        <bdi>{c.mon.nickname || getSpecies(c.mon.speciesId)?.name}</bdi> · {t('lv')} {c.mon.level}
                      </div>
                      <div className="truncate text-xs text-text-dim" dir="ltr" style={{ textAlign: 'start' }}>
                        {c.location}
                      </div>
                    </div>
                  </Row>
                ))}
              </div>
            </section>
          )}

          {visibleUpdates.length > 0 && (
            <section className="card p-4">
              <Label>{t('updatesTitle')}</Label>
              <div className="divide-y divide-border">
                {visibleUpdates.map((u) => (
                  <div key={u.mon.pid} className="flex items-center gap-3 py-2">
                    <Sprite id={u.mon.speciesId} style={style} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">
                        <bdi>{displayName(u.encounter)}</bdi>
                      </div>
                      <div className="text-xs text-text-dim">
                        {u.changes
                          .map((c) =>
                            c.kind === 'level'
                              ? t('changeLevel', c)
                              : c.kind === 'evolved'
                                ? t('changeEvolved', c)
                                : c.kind === 'nickname'
                                  ? t('changeNickname', c)
                                  : t('changeMoved', { to: c.to === 'party' ? t('statusParty') : t('statusBox') }),
                          )
                          .join(' · ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {plan.wrongGame.length > 0 && (
            <section className="card p-4">
              <Label>{t('wrongGameTitle')}</Label>
              <p className="-mt-1 mb-2 text-xs text-text-dim">{t('wrongGameHint')}</p>
              <div className="divide-y divide-border">
                {plan.wrongGame.map((e) => (
                  <Row key={e.id} checked={wrongGame.has(e)} onToggle={() => toggle(wrongGame, e, setWrongGame)}>
                    <Sprite id={e.speciesId} style={style} size={44} />
                    <div className="min-w-0 flex-1 truncate font-semibold">
                      <bdi>{displayName(e)}</bdi>
                    </div>
                  </Row>
                ))}
              </div>
            </section>
          )}

          {plan.missing.length > 0 && (
            <section className="card p-4">
              <Label>{t('missingTitle')}</Label>
              <p className="-mt-1 mb-2 text-xs text-text-dim">{t('missingHint')}</p>
              <div className="divide-y divide-border">
                {plan.missing.map((e) => (
                  <Row key={e.id} checked={missing.has(e)} onToggle={() => toggle(missing, e, setMissing)}>
                    <Sprite id={e.speciesId} style={style} size={44} />
                    <div className="min-w-0 flex-1 truncate font-semibold">
                      <bdi>{displayName(e)}</bdi>
                    </div>
                  </Row>
                ))}
              </div>
            </section>
          )}

          {plan.newBadges.length > 0 && (
            <section className="card p-4">
              <Label>{t('newBadgesTitle')}</Label>
              <div className="text-sm">🏅 {plan.newBadges.map((b) => b.name).join(', ')}</div>
            </section>
          )}

          {!empty || plan.updates.length ? (
            <Button className="w-full !py-3.5 text-lg" onClick={apply} disabled={busy}>
              {t('applySync')}
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}

function Row({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-2">
      <input type="checkbox" checked={checked} onChange={onToggle} className="h-5 w-5 shrink-0 accent-[var(--primary)]" />
      {children}
    </label>
  )
}
