import { useState } from 'react'
import type { Boss, BossMon } from '../data/gameData'
import { toggleBossDefeated } from '../db/repository'
import type { Run } from '../db/types'
import { BOSS_TYPE_LABELS, bossMonName, bossMonTypes, bossTeam, isDefeated, levelCap, prettySlug } from '../lib/bosses'
import { useT } from '../lib/settings'
import type { SpriteStyle } from '../lib/sprites'
import { weaknesses } from '../lib/typeChart'
import Sprite from './Sprite'
import { IconChevron } from './icons'
import { TypeBadge } from './ui'

interface Props {
  boss: Boss
  run: Run
  starter: string | undefined
  style: SpriteStyle
  defaultOpen?: boolean
}

export default function BossCard({ boss, run, starter, style, defaultOpen }: Props) {
  const t = useT()
  const [open, setOpen] = useState(!!defaultOpen)
  const team = bossTeam(boss, starter)
  const ace = team[team.length - 1]
  const done = isDefeated(run, boss)
  const dependsOnStarter = !starter && boss.team.some((m) => m.st)

  return (
    <div className={`card overflow-hidden ${done ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-3 text-start">
          <Sprite id={ace?.s} formId={ace?.f} style={style} size={48} dead={done} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate font-bold">{boss.name}</span>
              {boss.spec && <TypeBadge type={boss.spec} small />}
            </div>
            <div className="truncate text-xs text-text-dim">
              {t(BOSS_TYPE_LABELS[boss.type])} · <bdi>{boss.loc}</bdi>
              {boss.double && ` · ${t('doubleBattle')}`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums leading-none">{levelCap(boss, starter)}</div>
            <div className="text-[10px] text-text-dim">{t('levelCap')}</div>
          </div>
          <IconChevron size={18} className={`shrink-0 text-text-dim transition ${open ? 'rotate-90' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => toggleBossDefeated(run, boss.id)}
          aria-pressed={done}
          aria-label={t('markDefeated')}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold transition ${
            done ? 'border-good bg-good text-white' : 'border-border text-transparent'
          }`}
        >
          ✓
        </button>
      </div>

      {open && (
        <div className="space-y-2 border-t border-border bg-surface-hi/50 p-3">
          {dependsOnStarter && <p className="text-xs text-warn">{t('starterUnknown')}</p>}
          {team.map((m, i) => (
            <BossMonRow key={i} mon={m} style={style} showStarter={dependsOnStarter} />
          ))}
        </div>
      )}
    </div>
  )
}

function BossMonRow({ mon, style, showStarter }: { mon: BossMon; style: SpriteStyle; showStarter: boolean }) {
  const t = useT()
  const types = bossMonTypes(mon, style.gen)
  const weak = types.length ? weaknesses(types, style.gen) : []
  return (
    <div className="rounded-xl bg-surface p-2.5">
      <div className="flex items-center gap-2.5">
        <Sprite id={mon.s} formId={mon.f} style={style} size={52} />
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
            {mon.tt && <span className="text-[10px] text-text-dim">Tera: {prettySlug(mon.tt)}</span>}
          </div>
          {(mon.a || mon.i) && (
            <div className="mt-0.5 text-xs text-text-dim">
              {mon.a && prettySlug(mon.a)}
              {mon.a && mon.i && ' · '}
              {mon.i && `@ ${prettySlug(mon.i)}`}
            </div>
          )}
          {showStarter && mon.st && <div className="text-[11px] text-warn">{t('ifStarter', { type: mon.st })}</div>}
        </div>
      </div>
      {mon.m && mon.m.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {mon.m.map((move) => (
            <span key={move} className="rounded-md bg-surface-hi px-1.5 py-0.5 text-[11px]">
              {prettySlug(move)}
            </span>
          ))}
        </div>
      )}
      {weak.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-text-dim">
          {t('weakTo')}:
          {weak.map((w) => (
            <TypeBadge key={w.type} type={w.type} small suffix={w.x > 2 ? '×4' : undefined} />
          ))}
        </div>
      )}
    </div>
  )
}
