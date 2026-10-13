import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { Button, Label, Segmented, Toggle } from '../components/ui'
import { GAMES } from '../data/games'
import { createRun } from '../db/repository'
import type { RuleSet, Variant } from '../db/types'
import { RULES, VARIANT_LABELS, VARIANT_RULES } from '../lib/rules'
import { useSettings, useT } from '../lib/settings'

const CUSTOM = 'custom'
const lines = (s: string) => [...new Set(s.split('\n').map((l) => l.trim()).filter(Boolean))]

export default function NewRun() {
  const t = useT()
  const navigate = useNavigate()
  const { update } = useSettings()

  const [gameId, setGameId] = useState('emerald')
  const [name, setName] = useState('')
  const [variant, setVariant] = useState<Variant>('classic')
  const [rules, setRules] = useState<RuleSet>(VARIANT_RULES.classic)
  const [customRules, setCustomRules] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [customName, setCustomName] = useState('')
  const [customGen, setCustomGen] = useState(3)
  const [customLocations, setCustomLocations] = useState('')

  const isCustom = gameId === CUSTOM
  const game = GAMES.find((g) => g.id === gameId)
  const valid = !isCustom || customName.trim()

  function pickVariant(v: Variant) {
    setVariant(v)
    setRules(VARIANT_RULES[v])
  }

  async function start() {
    const gameName = isCustom ? customName.trim() : game!.name
    const id = await createRun({
      name: name.trim() || `${gameName} ${t(VARIANT_LABELS[variant])}`,
      gameId,
      customGame: isCustom ? { name: customName.trim(), gen: customGen, locations: lines(customLocations) } : undefined,
      variant,
      rules,
      customRules: lines(customRules),
      partnerName: variant === 'soullink' ? partnerName.trim() || undefined : undefined,
      extraLocations: [],
      badges: 0,
      status: 'active',
      createdAt: Date.now(),
    })
    update({ currentRunId: id })
    navigate('/', { replace: true })
  }

  const official = GAMES.filter((g) => !g.hack)
  const gens = [...new Set(official.map((g) => g.gen))]

  return (
    <PageShell title={t('newRun')}>
      <div className="space-y-5">
        <div>
          <Label>{t('game')}</Label>
          <select className="field" value={gameId} onChange={(e) => setGameId(e.target.value)}>
            {gens.map((gen) => (
              <optgroup key={gen} label={t('generation', { n: gen })}>
                {official.filter((g) => g.gen === gen).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </optgroup>
            ))}
            <optgroup label={t('romHacks')}>
              {GAMES.filter((g) => g.hack).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </optgroup>
            <option value={CUSTOM}>✏️ {t('customGame')}</option>
          </select>
        </div>

        {isCustom && (
          <div className="card space-y-3 p-4">
            <div>
              <Label>{t('customGameName')}</Label>
              <input className="field" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Radical Red" />
            </div>
            <div>
              <Label>{t('customGameGen')}</Label>
              <select className="field" value={customGen} onChange={(e) => setCustomGen(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                  <option key={g} value={g}>
                    {t('generation', { n: g })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('customGameLocations')}</Label>
              <textarea className="field min-h-32" dir="ltr" value={customLocations} onChange={(e) => setCustomLocations(e.target.value)} placeholder={'Route 1\nRoute 2\nViridian Forest'} />
              <p className="mt-1 text-xs text-text-dim">{t('customGameLocationsHint')}</p>
            </div>
          </div>
        )}

        <div>
          <Label>{t('runName')}</Label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('runNamePlaceholder')} />
        </div>

        <div>
          <Label>{t('variant')}</Label>
          <Segmented
            value={variant}
            onChange={pickVariant}
            options={(Object.keys(VARIANT_LABELS) as Variant[]).map((v) => ({ value: v, label: t(VARIANT_LABELS[v]) }))}
          />
        </div>

        {variant === 'soullink' && (
          <div>
            <Label>{t('partnerName')}</Label>
            <input className="field" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
          </div>
        )}

        <div className="card divide-y divide-border px-4 py-1">
          {RULES.map((r) => (
            <Toggle key={r.key} checked={rules[r.key]} onChange={(v) => setRules((s) => ({ ...s, [r.key]: v }))} label={t(r.label)} desc={t(r.desc)} />
          ))}
        </div>

        <div>
          <Label>{t('customRules')}</Label>
          <textarea className="field min-h-20" value={customRules} onChange={(e) => setCustomRules(e.target.value)} />
        </div>

        <Button className="w-full !py-3.5 text-lg" disabled={!valid} onClick={start}>
          {t('startRun')}
        </Button>
      </div>
    </PageShell>
  )
}
