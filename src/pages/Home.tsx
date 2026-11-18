import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import Sprite from '../components/Sprite'
import { IconChevron, IconPlus, IconSettings, IconTrophy, Pokeball } from '../components/icons'
import { Label } from '../components/ui'
import { useGameData } from '../data/gameData'
import { getSpecies } from '../data/pokedex'
import { db } from '../db/db'
import { byOrder } from '../db/hooks'
import { runGameName, runMaxBadges } from '../db/repository'
import type { Encounter, Run } from '../db/types'
import { bossTeam, isDefeated, levelCap, nextBoss, starterType } from '../lib/bosses'
import { VARIANT_LABELS } from '../lib/rules'
import { useSettings, useT } from '../lib/settings'
import { spriteStyleForGameId, spriteStyleForRun } from '../lib/sprites'

/** The app's front door: greeting, the run to continue, the other runs, champions and lifetime stats. */
export default function Home() {
  const t = useT()
  const navigate = useNavigate()
  const { playerName, currentRunId, lang, update } = useSettings()
  const data = useLiveQuery(async () => ({
    runs: await db.runs.orderBy('createdAt').reverse().toArray(),
    encounters: await db.encounters.toArray(),
    champions: await db.hallOfFame.orderBy('enteredAt').reverse().toArray(),
  }))

  const open = (run: Run) => {
    update({ currentRunId: run.id })
    navigate('/run')
  }

  if (!data) return null
  const { runs, encounters, champions } = data
  const active = runs.filter((r) => r.status === 'active')
  const hero = active.find((r) => r.id === currentRunId) ?? active[0]
  const others = active.filter((r) => r !== hero)
  const ofRun = (r: Run) => encounters.filter((e) => e.runId === r.id)
  const latest = champions[0]

  return (
    <div className="fixed inset-0 mx-auto flex max-w-2xl flex-col overflow-hidden">
      <header
        className="flex shrink-0 items-center gap-2.5 px-4 pb-2"
        style={{ paddingTop: 'calc(0.8rem + env(safe-area-inset-top, 0px))' }}
      >
        <Pokeball size={30} className="shrink-0 text-text" />
        <div className="flex-1 text-lg font-bold">{t('appName')}</div>
        <Link to="/settings" className="rounded-full p-2 text-text-dim hover:bg-surface-hi" aria-label={t('settings')}>
          <IconSettings size={22} />
        </Link>
      </header>

      <main className="flex-1 space-y-6 overflow-y-auto px-4 pb-8 pt-2" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
        <section className="animate-rise-in">
          <h1 className="text-2xl font-black">
            {playerName ? (
              <>
                {t('homeHello')} <bdi>{playerName}</bdi>!
              </>
            ) : (
              t('homeHelloAnon')
            )}
          </h1>
          <p className="text-sm text-text-dim">{runs.length ? t('homeSubtitle') : t('welcomeBody')}</p>
        </section>

        {hero ? (
          <HeroRun run={hero} encounters={ofRun(hero)} onOpen={() => open(hero)} />
        ) : (
          <Link
            to="/runs/new"
            className="animate-rise-in flex flex-col items-center gap-3 rounded-3xl bg-[linear-gradient(135deg,var(--primary),#ff8a3d)] px-6 py-8 text-center text-white shadow-lg"
          >
            <Pokeball size={56} className="text-[#171923]" />
            <div className="text-xl font-black">{runs.length ? t('homeNoActive') : t('welcomeTitle')}</div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 font-semibold">
              <IconPlus size={18} /> {t('newRun')}
            </span>
          </Link>
        )}

        {(others.length > 0 || hero) && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <Label>{t('homeYourRuns')}</Label>
              <Link to="/runs" className="text-xs font-semibold text-primary">
                {t('homeAllRuns')}
              </Link>
            </div>
            <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
              {others.map((r) => (
                <RunChip key={r.id} run={r} encounters={ofRun(r)} onOpen={() => open(r)} />
              ))}
              <Link
                to="/runs/new"
                className="flex w-36 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border p-3 text-sm font-semibold text-text-dim"
              >
                <IconPlus size={22} />
                {t('newRun')}
              </Link>
            </div>
          </section>
        )}

        {latest && (
          <Link
            to="/hall-of-fame"
            className="hof-plaque block overflow-hidden rounded-2xl shadow-[0_6px_24px_rgba(184,134,11,0.18)]"
          >
            <div className="flex items-center gap-2 bg-[linear-gradient(135deg,#2a2108,#120d02)] px-4 py-2.5">
              <IconTrophy size={18} className="text-[#ffcb05]" />
              <span className="hof-gold flex-1 text-sm font-black">{t('homeLatestChampions')}</span>
              <span className="text-xs text-white/60">{new Date(latest.enteredAt).toLocaleDateString(lang)}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                  <bdi>{latest.runName}</bdi>
                </div>
                <div className="truncate text-xs text-text-dim">{latest.gameName}</div>
              </div>
              <div className="flex">
                {latest.team.map((m, i) => (
                  <Sprite key={i} id={m.speciesId} style={spriteStyleForGameId(latest.gameId)} size={36} shiny={m.shiny} />
                ))}
              </div>
            </div>
          </Link>
        )}

        <section className="grid grid-cols-2 gap-2.5">
          <Tile to="/hall-of-fame" icon="🏆" label={t('hallOfFame')} value={champions.length || undefined} />
          <Tile to="/stats" icon="📊" label={t('stats')} />
          <Tile to="/runs" icon="🗂️" label={t('runs')} value={runs.length || undefined} />
          <Tile to="/settings" icon="⚙️" label={t('settings')} />
        </section>

        {encounters.length > 0 && (
          <section className="card grid grid-cols-4 py-3 text-center">
            <Stat value={runs.length} label={t('statRuns')} />
            <Stat value={runs.filter((r) => r.status === 'won').length} label={t('statWins')} />
            <Stat value={encounters.filter((e) => e.status !== 'missed').length} label={t('statCaught')} />
            <Stat value={encounters.filter((e) => e.status === 'dead').length} label={t('statDeaths')} />
          </section>
        )}
      </main>
    </div>
  )
}

function HeroRun({ run, encounters, onOpen }: { run: Run; encounters: Encounter[]; onOpen: () => void }) {
  const t = useT()
  const data = useGameData(run.customGame ? undefined : run.gameId)
  const style = spriteStyleForRun(run)
  const party = encounters.filter((e) => e.status === 'party').sort(byOrder)
  const alive = encounters.filter((e) => e.status === 'party' || e.status === 'box').length
  const dead = encounters.filter((e) => e.status === 'dead').length
  const gyms = data?.bosses.filter((b) => b.type === 'gym-leader') ?? []
  const badges = gyms.length ? gyms.filter((g) => isDefeated(run, g)).length : run.badges
  const maxBadges = gyms.length || runMaxBadges(run)
  const next = nextBoss(run, data ?? null)
  const starter = starterType(encounters, style.gen, data ?? null)
  const ace = next ? bossTeam(next, starter).at(-1) : undefined

  return (
    <button
      type="button"
      onClick={onOpen}
      className="animate-rise-in block w-full overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--primary),#ff8a3d)] text-start text-white shadow-lg transition active:scale-[0.99]"
    >
      <div className="px-5 pt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/75">{t('homeContinue')}</div>
        <div className="mt-0.5 truncate text-2xl font-black">
          <bdi>{run.name}</bdi>
        </div>
        <div className="text-sm text-white/80">
          {runGameName(run)} · {t(VARIANT_LABELS[run.variant])}
        </div>
      </div>

      <div className="mt-2 flex min-h-[72px] items-end px-3">
        {party.length ? (
          party.map((e) => (
            <div key={e.id} className="flex flex-1 flex-col items-center">
              <Sprite id={e.speciesId} style={style} size={56} shiny={e.shiny} />
              <span className="max-w-full truncate text-[10px] font-semibold text-white/90">{e.nickname || getSpecies(e.speciesId)?.name}</span>
            </div>
          ))
        ) : (
          <div className="px-2 pb-3 text-sm text-white/80">{t('emptyParty')}</div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 bg-black/15 px-5 py-3 text-sm">
        <span>💚 {alive}</span>
        <span>🪦 {dead}</span>
        {maxBadges > 0 && (
          <span>
            🏅 {badges}/{maxBadges}
          </span>
        )}
        <span className="flex-1" />
        {next && (
          <span className="flex items-center gap-1.5">
            <Sprite id={ace?.s} formId={ace?.f} style={style} size={28} />
            <span className="font-semibold">{next.name}</span>
            <span className="rounded-md bg-white/20 px-1.5 text-xs font-bold">{levelCap(next, starter)}</span>
          </span>
        )}
        <IconChevron size={18} className="rtl:rotate-180" />
      </div>
    </button>
  )
}

function RunChip({ run, encounters, onOpen }: { run: Run; encounters: Encounter[]; onOpen: () => void }) {
  const style = spriteStyleForRun(run)
  const party = encounters.filter((e) => e.status === 'party').sort(byOrder).slice(0, 3)
  return (
    <button type="button" onClick={onOpen} className="card w-44 shrink-0 p-3 text-start transition active:scale-[0.98]">
      <div className="truncate text-sm font-bold">
        <bdi>{run.name}</bdi>
      </div>
      <div className="truncate text-xs text-text-dim">{runGameName(run)}</div>
      <div className="mt-1.5 flex h-10">
        {party.map((e) => (
          <Sprite key={e.id} id={e.speciesId} style={style} size={40} shiny={e.shiny} />
        ))}
      </div>
    </button>
  )
}

function Tile({ to, icon, label, value }: { to: string; icon: string; label: string; value?: number }) {
  return (
    <Link to={to} className="card flex items-center gap-2.5 px-3 py-3 font-semibold transition active:scale-[0.98]">
      <span className="text-xl">{icon}</span>
      <span className="flex-1">{label}</span>
      {value !== undefined && <span className="rounded-full bg-surface-hi px-2 text-xs tabular-nums text-text-dim">{value}</span>}
    </Link>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-text-dim">{label}</div>
    </div>
  )
}
