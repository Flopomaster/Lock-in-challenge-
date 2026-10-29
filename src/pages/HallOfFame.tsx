import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import HallOfFameCeremony from '../components/HallOfFameCeremony'
import PageShell from '../components/PageShell'
import Sprite from '../components/Sprite'
import { IconTrophy } from '../components/icons'
import { getSpecies } from '../data/pokedex'
import { db } from '../db/db'
import type { HallOfFameEntry } from '../db/types'
import { VARIANT_LABELS } from '../lib/rules'
import { useSettings, useT } from '../lib/settings'
import { spriteStyleForGameId } from '../lib/sprites'

export default function HallOfFame() {
  const t = useT()
  const { lang } = useSettings()
  const entries = useLiveQuery(() => db.hallOfFame.orderBy('enteredAt').reverse().toArray())
  const [replay, setReplay] = useState<HallOfFameEntry>()
  if (!entries) return null

  return (
    <PageShell title={`🏆 ${t('hallOfFame')}`}>
      {!entries.length ? (
        <div className="animate-rise-in flex flex-col items-center px-6 pt-16 text-center">
          <IconTrophy size={72} className="text-[#d4a106]" />
          <p className="mt-4 text-lg font-semibold">{t('hofEmpty')}</p>
          <p className="mt-1 text-sm text-text-dim">{t('hofEmptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <Plaque key={entry.id} entry={entry} number={entries.length - i} lang={lang} onReplay={() => setReplay(entry)} />
          ))}
        </div>
      )}
      {replay && <HallOfFameCeremony entry={replay} onClose={() => setReplay(undefined)} />}
    </PageShell>
  )
}

function Plaque({ entry, number, lang, onReplay }: { entry: HallOfFameEntry; number: number; lang: string; onReplay: () => void }) {
  const t = useT()
  const style = spriteStyleForGameId(entry.gameId)
  const days = Math.max(1, Math.round((entry.enteredAt - entry.startedAt) / 86_400_000))
  return (
    <article className="hof-plaque animate-rise-in overflow-hidden rounded-2xl shadow-[0_6px_24px_rgba(184,134,11,0.18)]">
      <div className="bg-[linear-gradient(135deg,#2a2108,#120d02)] px-4 py-3 text-white">
        <div className="hof-gold text-xs font-black">{t('hofEntryNumber', { n: number })}</div>
        <div className="mt-0.5 text-lg font-bold">
          <bdi>{entry.runName}</bdi>
        </div>
        <div className="text-xs text-white/60">
          {entry.gameName} · {t(VARIANT_LABELS[entry.variant])}
          {entry.trainer && (
            <>
              {' '}
              · <bdi>{entry.trainer}</bdi>
            </>
          )}
          {entry.partnerName && <> · 🔗 <bdi>{entry.partnerName}</bdi></>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 p-3">
        {entry.team.map((m, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <Sprite id={m.speciesId} style={style} size={64} shiny={m.shiny} />
            <div className="w-full truncate text-sm font-bold">
              <bdi>{m.nickname || getSpecies(m.speciesId)?.name}</bdi>
            </div>
            <div className="text-[11px] text-text-dim">
              {getSpecies(m.speciesId)?.name}
              {m.level ? ` · ${t('lv')} ${m.level}` : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-4 py-2.5 text-xs text-text-dim">
        <span>{t('hofInducted', { date: new Date(entry.enteredAt).toLocaleDateString(lang) })}</span>
        <span>{t('hofDays', { days })}</span>
        <span>🏅 {entry.stats.badges}</span>
        <span>🪦 {entry.stats.deaths}</span>
      </div>
      {entry.fallen.length > 0 && (
        <div className="flex items-center gap-2 border-t border-border px-4 py-2">
          <span className="text-xs text-text-dim">🕯️ {t('hofFallen')}</span>
          <div className="flex flex-wrap">
            {entry.fallen.map((f, i) => (
              <Sprite key={i} id={f.speciesId} style={style} size={28} dead />
            ))}
          </div>
        </div>
      )}
      <div className="flex border-t border-border text-sm">
        <button type="button" onClick={onReplay} className="flex-1 py-2.5 font-semibold text-[#b8860b]">
          ✨ {t('hofReplay')}
        </button>
        <button
          type="button"
          onClick={() => confirm(t('hofDeleteConfirm')) && db.hallOfFame.delete(entry.id!)}
          className="border-s border-border px-4 py-2.5 text-text-dim"
        >
          {t('delete')}
        </button>
      </div>
    </article>
  )
}
