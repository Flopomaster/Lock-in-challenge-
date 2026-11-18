import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getSpecies } from '../data/pokedex'
import type { HallOfFameEntry } from '../db/types'
import { daysLabel, useSettings, useT } from '../lib/settings'
import { playChime, playFanfare } from '../lib/sound'
import { spriteStyleForGameId } from '../lib/sprites'
import Sprite from './Sprite'
import { IconTrophy } from './icons'

// Fixed, evenly scattered sparkle positions (golden-angle spiral) — stable across renders.
const SPARKS = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 61.8) % 100}%`,
  top: `${(i * 37.3 + 11) % 100}%`,
  delay: `${((i * 0.37) % 2.4).toFixed(2)}s`,
}))

const INTRO_MS = 2600
const PER_MON_MS = 2100

/** The induction ceremony: title card, each champion in the spotlight, then the whole team together. */
export default function HallOfFameCeremony({ entry, onClose }: { entry: HallOfFameEntry; onClose: () => void }) {
  const t = useT()
  const { sound, lang } = useSettings()
  const style = spriteStyleForGameId(entry.gameId)
  // The ace steps into the spotlight last, as the climax.
  const team = [...entry.team.filter((m) => !m.ace), ...entry.team.filter((m) => m.ace)]
  // step -1 = title card, 0..n-1 = each champion, n = finale
  const [step, setStep] = useState(-1)
  const finale = step >= team.length

  useEffect(() => {
    if (sound) playFanfare()
  }, [sound])

  useEffect(() => {
    if (finale) {
      if (sound) playFanfare()
      return
    }
    if (step >= 0 && sound) playChime(step)
    const timer = setTimeout(() => setStep((s) => s + 1), step < 0 ? INTRO_MS : PER_MON_MS)
    return () => clearTimeout(timer)
  }, [step, finale, sound])

  const days = Math.max(1, Math.round((entry.enteredAt - entry.startedAt) / 86_400_000))
  const mon = !finale && step >= 0 ? team[step] : undefined

  return createPortal(
    <div
      className="hof-stage fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-center text-white"
      onClick={() => !finale && setStep(team.length)}
    >
      <div className="hof-rays pointer-events-none absolute -inset-1/2" />
      {SPARKS.map((s, i) => (
        <span key={i} className="hof-spark" style={{ left: s.left, top: s.top, animationDelay: s.delay }} />
      ))}

      {step < 0 && (
        <div key="intro" className="hof-pop relative">
          <IconTrophy size={72} className="mx-auto text-[#ffcb05] hof-glow" />
          <div className="hof-gold mt-4 text-5xl font-black tracking-[0.15em]">HALL OF FAME</div>
          <div className="mt-3 text-lg text-white/70">{t('hallOfFame')}</div>
        </div>
      )}

      {mon && (
        <div key={`mon-${step}`} className="relative flex flex-col items-center">
          <div className="absolute top-6 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,220,100,0.35),transparent_65%)]" />
          {mon.ace && <div className="crown-drop relative z-10 -mb-6 text-5xl ace-crown">👑</div>}
          <div className="hof-pop hof-glow relative">
            <Sprite id={mon.speciesId} style={style} size={mon.ace ? 230 : 200} shiny={mon.shiny} />
          </div>
          <div className="hof-rise mt-2" style={{ animationDelay: '0.35s' }}>
            <div className="hof-gold text-4xl font-black">
              <bdi>{mon.nickname || getSpecies(mon.speciesId)?.name}</bdi>
            </div>
            {mon.ace && <div className="mt-1 text-sm font-bold uppercase tracking-wide text-[#ffcb05]">👑 {t('aceOfRun')}</div>}
            <div className="mt-1 text-white/75">
              {getSpecies(mon.speciesId)?.name}
              {mon.level ? ` · ${t('lv')} ${mon.level}` : ''}
            </div>
          </div>
          <div className="mt-6 flex gap-1.5">
            {team.map((_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? 'bg-[#ffcb05]' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      )}

      {finale && (
        <div key="finale" className="relative flex w-full max-w-md flex-col items-center">
          <div className="hof-pop flex flex-wrap justify-center">
            {team.map((m, i) => (
              <div key={i} className="hof-rise relative flex w-1/3 flex-col items-center" style={{ animationDelay: `${i * 0.12}s` }}>
                {m.ace && <span className="ace-crown absolute -top-3 text-xl">👑</span>}
                <div className="hof-glow">
                  <Sprite id={m.speciesId} style={style} size={84} shiny={m.shiny} />
                </div>
                <div className="truncate text-xs font-bold text-[#ffe680]">
                  <bdi>{m.nickname || getSpecies(m.speciesId)?.name}</bdi>
                </div>
              </div>
            ))}
          </div>
          <div className="hof-gold hof-rise mt-5 text-3xl font-black" style={{ animationDelay: '0.6s' }}>
            {t('hofWelcome')}
          </div>
          <div className="hof-rise mt-1 text-sm text-white/70" style={{ animationDelay: '0.8s' }}>
            {t('hofSubtitle')}
          </div>
          <div className="hof-rise mt-4 text-sm text-white/85" style={{ animationDelay: '1s' }}>
            <div className="font-semibold">
              <bdi>{entry.runName}</bdi> · {entry.gameName}
            </div>
            <div className="text-white/60">
              {entry.trainer && (
                <>
                  <bdi>{entry.trainer}</bdi> ·{' '}
                </>
              )}
              {new Date(entry.enteredAt).toLocaleDateString(lang)} · {daysLabel(t, days)}
            </div>
            <div className="mt-1 text-white/60">
              🏅 {entry.stats.badges} · ⚪ {entry.stats.caught} · 🪦 {entry.stats.deaths}
            </div>
          </div>
          {entry.fallen.length > 0 && (
            <div className="hof-rise mt-4" style={{ animationDelay: '1.2s' }}>
              <div className="text-xs text-white/50">🕯️ {t('hofFallen')}</div>
              <div className="flex flex-wrap justify-center opacity-60">
                {entry.fallen.map((f, i) => (
                  <Sprite key={i} id={f.speciesId} style={style} size={36} dead />
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="hof-rise mt-6 rounded-xl bg-[#ffcb05] px-8 py-3 font-bold text-[#2a2108] shadow-[0_0_24px_rgba(255,203,5,0.5)]"
            style={{ animationDelay: '1.4s' }}
          >
            {t('hofContinue')}
          </button>
        </div>
      )}
    </div>,
    document.body,
  )
}
