import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sheet from '../components/Sheet'
import Sprite from '../components/Sprite'
import { Button, Label, Warning } from '../components/ui'
import { getGame } from '../data/games'
import { getSpecies, typesInGen } from '../data/pokedex'
import { displayName, runLocations } from '../db/repository'
import type { Encounter, PartnerMon } from '../db/types'
import { useRun } from '../lib/runContext'
import { useSettings, useT } from '../lib/settings'
import { decodeShareCode, encodeShareCode, importPartner, isAlive, shareLink, type DecodedCode } from '../lib/soulLink'
import { spriteStyleForRun, type SpriteStyle } from '../lib/sprites'

export default function SoulLink() {
  const t = useT()
  const { lang, playerName } = useSettings()
  const { run, encounters, data } = useRun()
  const style = spriteStyleForRun(run)
  const [params, setParams] = useSearchParams()
  const [pasting, setPasting] = useState(false)
  const [message, setMessage] = useState<string>()
  const partnerName = run.partnerName || t('partner')
  const handledCode = useRef<string>(null)

  async function applyCode(decoded: DecodedCode) {
    if (decoded.gameId !== run.gameId && !confirm(t('codeWrongGame', { game: getGame(decoded.gameId)?.name ?? decoded.gameId }))) return
    await importPartner(run, decoded)
    setMessage(t('codeImported', { count: Object.keys(decoded.mons).length, name: decoded.name || partnerName }))
  }

  // Opened from a share link: #/soul-link?code=NZ1....
  const linkCode = params.get('code')
  useEffect(() => {
    if (!linkCode || handledCode.current === linkCode) return
    handledCode.current = linkCode
    setParams({}, { replace: true })
    if (run.variant !== 'soullink') {
      setMessage(t('noSoulLinkRun'))
      return
    }
    decodeShareCode(linkCode)
      .then((decoded) => {
        if (confirm(t('importFromLink', { name: decoded.name || partnerName, run: run.name }))) return applyCode(decoded)
      })
      .catch(() => setMessage(t('codeInvalid')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkCode])

  async function share() {
    const code = await encodeShareCode(run, encounters, playerName)
    const text = `🔗 ${run.name}\n${shareLink(code)}`
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
    } catch {
      // Share sheet dismissed or unavailable: fall back to the clipboard.
    }
    try {
      await navigator.clipboard.writeText(text)
      setMessage(t('codeCopied'))
    } catch {
      prompt('', text)
    }
  }

  const mine = new Map(encounters.map((e) => [e.location, e]))
  const theirs = run.partner?.mons ?? {}
  const order = runLocations(run, data)
  const locations = [...new Set([...order, ...encounters.map((e) => e.location), ...Object.keys(theirs)])].filter(
    (l) => mine.has(l) || theirs[l],
  )

  // Classic Soul Link rule: no two party Pokémon (on your side) share a primary type.
  const partyPrimaries = encounters
    .filter((e) => e.status === 'party')
    .map((e) => getSpecies(e.speciesId))
    .filter((s) => !!s)
    .map((s) => typesInGen(s, style.gen)[0])
  const clashes = [...new Set(partyPrimaries.filter((ty, i) => partyPrimaries.indexOf(ty) !== i))]

  return (
    <div className="animate-rise-in space-y-4">
      <div className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold">
              🔗 {t('you')} × <bdi>{partnerName}</bdi>
            </div>
            <div className="text-xs text-text-dim">
              {run.partner ? t('lastSync', { time: new Date(run.partner.importedAt).toLocaleString(lang) }) : t('neverSynced')}
            </div>
          </div>
        </div>
        <p className="text-sm text-text-dim">{t('soulLinkDesc')}</p>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={share}>
            {t('shareMyCode')}
          </Button>
          <Button tone="soft" className="flex-1" onClick={() => setPasting(true)}>
            {t('importCode')}
          </Button>
        </div>
        {message && <div className="rounded-xl bg-primary-bg px-3 py-2 text-sm">{message}</div>}
      </div>

      {clashes.map((ty) => (
        <Warning key={ty}>{t('sameTypeWarn', { type: ty })}</Warning>
      ))}

      <div className="space-y-2">
        {locations.map((loc) => (
          <PairRow key={loc} location={loc} mine={mine.get(loc)} theirs={theirs[loc]} style={style} />
        ))}
      </div>

      {pasting && <PasteSheet onClose={() => setPasting(false)} onCode={applyCode} />}
    </div>
  )
}

function PairRow({ location, mine, theirs, style }: { location: string; mine?: Encounter; theirs?: PartnerMon; style: SpriteStyle }) {
  const t = useT()
  const broken = !!mine && !!theirs && isAlive(mine.status) !== isAlive(theirs.status) && (mine.status === 'dead' || theirs.status === 'dead')
  const split = !!mine && !!theirs && !broken && (mine.status === 'party') !== (theirs.status === 'party') && isAlive(mine.status) && isAlive(theirs.status)

  return (
    <div className={`card p-3 ${broken ? '!border-danger' : ''}`}>
      <div className="mb-1.5 text-xs font-semibold text-text-dim" dir="ltr" style={{ textAlign: 'start' }}>
        {location}
      </div>
      <div className="flex items-center gap-2">
        <Side name={mine ? displayName(mine) : undefined} speciesId={mine?.speciesId} status={mine?.status} level={mine?.level} style={style} />
        <span className={`text-lg ${broken ? 'text-danger' : 'text-text-dim'}`}>🔗</span>
        <Side name={theirs?.nickname || getSpecies(theirs?.speciesId)?.name} speciesId={theirs?.speciesId} status={theirs?.status} level={theirs?.level} style={style} />
      </div>
      {broken && <p className="mt-1.5 text-xs font-semibold text-danger">{t('linkBroken')}</p>}
      {split && <p className="mt-1.5 text-xs text-warn">{t('linkSplit')}</p>}
    </div>
  )
}

function Side({ name, speciesId, status, level, style }: { name?: string; speciesId?: number; status?: Encounter['status']; level?: number; style: SpriteStyle }) {
  const t = useT()
  if (!status) return <div className="flex flex-1 items-center justify-center text-sm text-text-dim">—</div>
  const dead = status === 'dead' || status === 'missed'
  const label = { party: t('statusParty'), box: t('statusBox'), dead: t('statusDead'), missed: t('statusMissed') }[status]
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Sprite id={speciesId} style={style} size={44} dead={dead} />
      <div className="min-w-0">
        <div className={`truncate text-sm font-bold ${dead ? 'text-text-dim line-through' : ''}`}>
          <bdi>{name ?? '?'}</bdi>
        </div>
        <div className="text-[11px] text-text-dim">
          {label}
          {level ? ` · ${t('lv')} ${level}` : ''}
        </div>
      </div>
    </div>
  )
}

function PasteSheet({ onClose, onCode }: { onClose: () => void; onCode: (d: DecodedCode) => Promise<void> }) {
  const t = useT()
  const [text, setText] = useState('')
  const [error, setError] = useState(false)

  async function submit() {
    try {
      const decoded = await decodeShareCode(text)
      await onCode(decoded)
      onClose()
    } catch {
      setError(true)
    }
  }

  return (
    <Sheet
      title={t('importCode')}
      onClose={onClose}
      footer={
        <Button className="flex-1" disabled={!text.trim()} onClick={submit}>
          {t('confirm')}
        </Button>
      }
    >
      <Label>{t('importCode')}</Label>
      <textarea
        autoFocus
        dir="ltr"
        className="field min-h-28 font-mono text-xs"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(false)
        }}
        placeholder={t('importCodePlaceholder')}
      />
      {error && <p className="mt-2 text-sm text-danger">{t('codeInvalid')}</p>}
    </Sheet>
  )
}
