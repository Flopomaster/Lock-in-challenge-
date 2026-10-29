import { useState } from 'react'
import { useParams } from 'react-router-dom'
import BossCard from '../components/BossCard'
import MoveChip from '../components/MoveChip'
import Sprite from '../components/Sprite'
import { Label, Toggle, TypeBadge, Warning } from '../components/ui'
import type { BossMon } from '../data/gameData'
import { getMove, isDamaging, moveName } from '../data/moves'
import { getSpecies, typesInGen } from '../data/pokedex'
import { byOrder } from '../db/hooks'
import { displayName } from '../db/repository'
import type { Encounter } from '../db/types'
import { rankAnswers, type Answer } from '../lib/battle'
import { bossMonName, bossMonTypes, bossTeam, prettySlug, starterType } from '../lib/bosses'
import { useRun } from '../lib/runContext'
import { useT } from '../lib/settings'
import { spriteStyleForRun, type SpriteStyle } from '../lib/sprites'
import { multiplier } from '../lib/typeChart'

const fmt = (x: number) => (x === 0 ? '×0' : x >= 1 ? `×${x}` : `×${x === 0.25 ? '¼' : '½'}`)

export default function BattlePlan() {
  const t = useT()
  const { bossId } = useParams()
  const { run, encounters, data } = useRun()
  const style = spriteStyleForRun(run)
  const [withBox, setWithBox] = useState(false)
  const boss = data?.bosses.find((b) => b.id === bossId)
  if (!boss) return null

  const team = bossTeam(boss, starterType(encounters, style.gen, data))
  const ours = encounters.filter((e) => e.speciesId && (e.status === 'party' || (withBox && e.status === 'box'))).sort(byOrder)
  const movesLogged = ours.some((e) => e.moves?.length)

  return (
    <div className="animate-rise-in space-y-4">
      <BossCard boss={boss} run={run} starter={starterType(encounters, style.gen, data)} style={style} />
      <Toggle checked={withBox} onChange={setWithBox} label={t('includeBox')} />
      {!movesLogged && ours.length > 0 && <p className="text-xs text-text-dim">💡 {t('movesUnknownHint')}</p>}
      {!ours.length ? (
        <div className="card p-5 text-center text-text-dim">{t('noPartyForPlan')}</div>
      ) : (
        team.map((mon, i) => <Matchup key={i} mon={mon} ours={ours} style={style} />)
      )}
    </div>
  )
}

function Matchup({ mon, ours, style }: { mon: BossMon; ours: Encounter[]; style: SpriteStyle }) {
  const t = useT()
  const types = bossMonTypes(mon, style.gen)
  const answers = rankAnswers(mon, ours, style.gen)
  const top = answers.slice(0, 3)
  const nobodyHitsHard = answers.every((a) => a.offense.x <= 1)

  // Which of the boss's moves hit someone on our side super-effectively.
  const threatening = new Set(
    (mon.m ?? []).filter((slug) => {
      const m = getMove(slug)
      return isDamaging(m) && ours.some((e) => {
        const s = getSpecies(e.speciesId)
        return s && multiplier(m.t, typesInGen(s, style.gen), style.gen) > 1
      })
    }),
  )

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border bg-surface-hi/50 p-3">
        <Sprite id={mon.s} formId={mon.f} style={style} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold">{bossMonName(mon)}</span>
            <span className="text-sm text-text-dim">
              {t('lv')} {mon.l}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {types.map((ty) => (
              <TypeBadge key={ty} type={ty} small />
            ))}
            {mon.a && <span className="text-[11px] text-text-dim">{prettySlug(mon.a)}</span>}
            {mon.i && <span className="text-[11px] text-text-dim">@ {prettySlug(mon.i)}</span>}
          </div>
          {mon.m && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {mon.m.map((m) => (
                <MoveChip key={m} move={m} highlight={threatening.has(m)} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        <Label>{t('bestAnswers')}</Label>
        {nobodyHitsHard && <Warning>{t('noCoverage', { name: bossMonName(mon) })}</Warning>}
        {top.map((a) => (
          <AnswerRow key={a.encounter.id} answer={a} bossLevel={mon.l} style={style} />
        ))}
      </div>
    </section>
  )
}

function AnswerRow({ answer, bossLevel, style }: { answer: Answer; bossLevel: number; style: SpriteStyle }) {
  const t = useT()
  const { encounter: e, offense, defense } = answer
  const offTone = offense.x > 1 ? 'bg-good-bg text-good' : offense.x < 1 ? 'bg-danger-bg text-danger' : 'bg-surface-hi text-text-dim'
  const defTone = defense.x > 1 ? 'bg-danger-bg text-danger' : defense.x < 1 ? 'bg-good-bg text-good' : 'bg-surface-hi text-text-dim'
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-surface-hi/60 p-2">
      <Sprite id={e.speciesId} style={style} size={44} shiny={e.shiny} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate font-semibold">
            <bdi>{displayName(e)}</bdi>
          </span>
          {e.level !== undefined && (
            <span className={`text-[11px] ${answer.levelGap < -3 ? 'text-danger' : 'text-text-dim'}`}>{t('levelVs', { ours: e.level, theirs: bossLevel })}</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-1 text-[11px] font-medium">
          <span className={`rounded-md px-1.5 py-0.5 ${offTone}`} dir="auto">
            ⚔️ {offense.move ? t('hitsFor', { x: fmt(offense.x), move: moveName(offense.move) }) : t('hitsForType', { x: fmt(offense.x), type: offense.type })}
          </span>
          <span className={`rounded-md px-1.5 py-0.5 ${defTone}`} dir="auto">
            🛡️ {defense.move ? t('takesFrom', { x: fmt(defense.x), move: moveName(defense.move) }) : t('takesFromType', { x: fmt(defense.x), type: defense.type ?? '' })}
          </span>
        </div>
      </div>
    </div>
  )
}
