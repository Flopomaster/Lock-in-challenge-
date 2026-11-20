import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Sprite from '../components/Sprite'
import { Button } from '../components/ui'
import { getSpecies } from '../data/pokedex'
import { db } from '../db/db'
import { displayName } from '../db/repository'
import type { Encounter } from '../db/types'
import { useRun } from '../lib/runContext'
import { daysLabel, useSettings, useT, type TFunction } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'

type Entry =
  | { kind: 'start'; at: number }
  | { kind: 'catch' | 'miss' | 'death'; at: number; e: Encounter }
  | { kind: 'evolve' | 'trade'; at: number; e?: Encounter; from: number; to: number }
  | { kind: 'boss'; at: number; name: string; gym: boolean }
  | { kind: 'ace'; at: number; e: Encounter }
  | { kind: 'won' | 'lost' | 'hof'; at: number }

/** The run as a story: start, catches, losses, evolutions, boss wins and the ending, in order. */
export default function Journal() {
  const t = useT()
  const { lang } = useSettings()
  const { run, encounters } = useRun()
  const style = spriteStyleForRun(run)
  const [copied, setCopied] = useState(false)
  const extra = useLiveQuery(
    async () => ({
      events: await db.journal.where({ runId: run.id! }).toArray(),
      hof: await db.hallOfFame.where({ runId: run.id! }).first(),
    }),
    [run.id],
  )
  if (!extra) return null

  const byId = new Map(encounters.map((e) => [e.id, e]))
  // The species each Pokémon was caught as: before its first logged evolution or trade.
  const caughtAs = new Map<number | undefined, number>()
  for (const j of [...extra.events].sort((a, b) => a.at - b.at))
    if ((j.kind === 'evolve' || j.kind === 'trade') && j.from && !caughtAs.has(j.encounterId)) caughtAs.set(j.encounterId, j.from)
  const entries: Entry[] = [{ kind: 'start', at: run.createdAt }]
  for (const e of encounters) {
    const asCaught = caughtAs.has(e.id) ? { ...e, speciesId: caughtAs.get(e.id) } : e
    entries.push({ kind: e.status === 'missed' ? 'miss' : 'catch', at: e.createdAt, e: asCaught })
    if (e.status === 'dead' && e.death?.at) entries.push({ kind: 'death', at: e.death.at, e })
  }
  for (const j of extra.events) {
    if ((j.kind === 'evolve' || j.kind === 'trade') && j.from && j.to) entries.push({ kind: j.kind, at: j.at, e: byId.get(j.encounterId), from: j.from, to: j.to })
    if (j.kind === 'boss') entries.push({ kind: 'boss', at: j.at, name: j.bossName ?? '?', gym: !!j.gym })
    const crowned = j.kind === 'ace' ? byId.get(j.encounterId) : undefined
    if (crowned) entries.push({ kind: 'ace', at: j.at, e: crowned })
  }
  if (run.status !== 'active' && run.endedAt) entries.push({ kind: run.status === 'won' ? 'won' : 'lost', at: run.endedAt })
  if (extra.hof) entries.push({ kind: 'hof', at: extra.hof.enteredAt + 1 })
  entries.sort((a, b) => a.at - b.at)

  // From the start to the latest moment in the story (or the end of the run).
  const days = Math.max(1, Math.ceil(((run.endedAt ?? entries[entries.length - 1].at) - run.createdAt) / 86_400_000))
  const day = (at: number) => new Date(at).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })

  async function share() {
    const text = [
      `📖 ${run.name}`,
      ...entries.map((entry) => `${new Date(entry.at).toLocaleDateString(lang)} · ${plainText(entry, t)}`),
    ].join('\n')
    try {
      if (navigator.share) {
        await navigator.share({ title: run.name, text })
        return
      }
    } catch {
      return // share sheet dismissed
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      prompt('', text)
    }
  }

  let lastDay = ''
  return (
    <div className="animate-rise-in space-y-4">
      <div className="card flex items-center gap-3 p-4">
        <div className="text-3xl">📖</div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">
            <bdi>{run.name}</bdi>
          </div>
          <div className="text-xs text-text-dim">
            {t('journalSummary', {
              days: daysLabel(t, days),
              caught: encounters.filter((e) => e.status !== 'missed').length,
              dead: encounters.filter((e) => e.status === 'dead').length,
            })}
          </div>
        </div>
        <Button tone="soft" className="!px-3 !py-1.5 text-sm" onClick={share}>
          {copied ? '✓' : t('shareTeam')}
        </Button>
      </div>

      <ol className="relative space-y-2 border-s-2 border-border ps-4">
        {entries.map((entry, i) => {
          const d = day(entry.at)
          const header = d !== lastDay
          lastDay = d
          return (
            <li key={i}>
              {header && <div className="-ms-[25px] mb-1.5 mt-3 flex items-center gap-2 text-xs font-semibold text-text-dim"><span className="h-2.5 w-2.5 rounded-full bg-border" />{d}</div>}
              <Row entry={entry} style={style} />
            </li>
          )
        })}
      </ol>
      {entries.length <= 1 && <p className="text-center text-sm text-text-dim">{t('journalEmpty')}</p>}
    </div>
  )
}

function Row({ entry, style }: { entry: Entry; style: ReturnType<typeof spriteStyleForRun> }) {
  const t = useT()
  const time = new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const tone: Record<Entry['kind'], string> = {
    start: 'bg-primary-bg', catch: 'bg-surface', miss: 'bg-surface-hi/60 text-text-dim', death: 'bg-danger-bg',
    evolve: 'bg-surface', trade: 'bg-surface', boss: 'bg-warn-bg', ace: 'ace-card bg-surface', won: 'bg-good-bg', lost: 'bg-danger-bg', hof: 'hof-plaque',
  }
  const sprite =
    entry.kind === 'catch' || entry.kind === 'miss' || entry.kind === 'death'
      ? <Sprite id={entry.e.speciesId} style={style} size={40} shiny={entry.e.shiny} dead={entry.kind !== 'catch'} />
      : entry.kind === 'evolve' || entry.kind === 'trade'
        ? <Sprite id={entry.to} style={style} size={40} shiny={entry.e?.shiny} />
        : entry.kind === 'ace'
        ? <Sprite id={entry.e.speciesId} style={style} size={40} shiny={entry.e.shiny} />
        : <span className="flex h-10 w-10 items-center justify-center text-2xl">{ICON[entry.kind]}</span>
  const body = <div className="min-w-0 flex-1 text-sm">{rich(entry, t)}</div>
  const inner = (
    <>
      {sprite}
      {body}
      <span className="shrink-0 text-[10px] tabular-nums text-text-dim">{time}</span>
    </>
  )
  const cls = `flex items-center gap-2.5 rounded-xl border border-border px-2.5 py-1.5 ${tone[entry.kind]}`
  return entry.kind === 'hof' ? <Link to="/hall-of-fame" className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>
}

const ICON: Partial<Record<Entry['kind'], string>> = { start: '🏁', boss: '🏅', won: '🏆', lost: '💀', hof: '✨' }

const speciesName = (id?: number) => getSpecies(id)?.name ?? '?'

/** The entry as a short sentence (rich: names in bold). */
function rich(entry: Entry, t: TFunction) {
  const name = (e: Encounter) => <b><bdi>{displayName(e)}</bdi></b>
  switch (entry.kind) {
    case 'start':
      return <b>{t('journalStart')}</b>
    case 'catch':
      return (
        <>
          {t('journalCaught')} {name(entry.e)}
          {entry.e.nickname && <span className="text-text-dim"> ({speciesName(entry.e.speciesId)})</span>}
          <div className="text-xs text-text-dim">
            <bdi>{entry.e.location}</bdi>
            {entry.e.level ? ` · ${t('lv')} ${entry.e.level}` : ''}
          </div>
        </>
      )
    case 'miss':
      return (
        <>
          {entry.e.speciesId ? speciesName(entry.e.speciesId) : t('unknownPokemon')} {t('journalGotAway')}
          <div className="text-xs"><bdi>{entry.e.location}</bdi></div>
        </>
      )
    case 'death':
      return (
        <>
          🪦 {name(entry.e)} {t('journalFell')}
          {(entry.e.death?.killer || entry.e.death?.location) && (
            <div className="text-xs text-text-dim">
              {entry.e.death?.killer && t('killedBy', { killer: entry.e.death.killer })}
              {entry.e.death?.killer && entry.e.death?.location && ' · '}
              {entry.e.death?.location && <bdi>{entry.e.death.location}</bdi>}
            </div>
          )}
        </>
      )
    case 'evolve':
      return (
        <>
          ✨ {entry.e ? name(entry.e) : speciesName(entry.from)} {t('journalEvolved')}
          <b>{speciesName(entry.to)}</b>
        </>
      )
    case 'trade':
      return (
        <>
          🔁 <b>{speciesName(entry.from)}</b> {t('journalTraded')}
          <b>{speciesName(entry.to)}</b>
        </>
      )
    case 'boss':
      return (
        <>
          {t('journalBeat')} <b>{entry.name}</b>
          {entry.gym && <span className="text-text-dim"> · {t('journalBadge')}</span>}
        </>
      )
    case 'ace':
      return (
        <>
          👑 {name(entry.e)} {t('journalAce')}
        </>
      )
    case 'won':
      return <b className="text-good">{t('journalWon')}</b>
    case 'lost':
      return <b className="text-danger">{t('journalLost')}</b>
    case 'hof':
      return <b className="hof-gold">{t('journalHof')}</b>
  }
}

/** The same sentence as plain text, for sharing. */
function plainText(entry: Entry, t: TFunction): string {
  switch (entry.kind) {
    case 'start':
      return `🏁 ${t('journalStart')}`
    case 'catch':
      return `⚪ ${t('journalCaught')} ${displayName(entry.e)} (${entry.e.location})`
    case 'miss':
      return `💨 ${entry.e.speciesId ? speciesName(entry.e.speciesId) : t('unknownPokemon')} ${t('journalGotAway')} (${entry.e.location})`
    case 'death':
      return `🪦 ${displayName(entry.e)} ${t('journalFell')}${entry.e.death?.killer ? ` — ${entry.e.death.killer}` : ''}`
    case 'evolve':
      return `✨ ${entry.e ? displayName(entry.e) : speciesName(entry.from)} ${t('journalEvolved')}${speciesName(entry.to)}`
    case 'trade':
      return `🔁 ${speciesName(entry.from)} ${t('journalTraded')}${speciesName(entry.to)}`
    case 'boss':
      return `🏅 ${t('journalBeat')} ${entry.name}`
    case 'ace':
      return `👑 ${displayName(entry.e)} ${t('journalAce')}`
    case 'won':
      return `🏆 ${t('journalWon')}`
    case 'lost':
      return `💀 ${t('journalLost')}`
    case 'hof':
      return `✨ ${t('journalHof')}`
  }
}
