import { useRef } from 'react'
import PageShell from '../components/PageShell'
import { Button, Label, Segmented } from '../components/ui'
import { db } from '../db/db'
import { exportBackup, importBackup } from '../lib/backup'
import { useSettings, useT, type Theme } from '../lib/settings'

export default function Settings() {
  const t = useT()
  const { lang, theme, sound, playerName, currentRunId, update } = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)

  const modeRef = useRef<'add' | 'replace'>('add')

  async function onImport(file: File | undefined) {
    const mode = modeRef.current
    if (!file || (mode === 'replace' && !confirm(t('importConfirm')))) return
    try {
      const result = await importBackup(file, mode)
      if (mode === 'add' && result.firstRunId) update({ currentRunId: result.firstRunId })
      else if (currentRunId && !(await db.runs.get(currentRunId))) update({ currentRunId: undefined })
      alert(t(mode === 'add' ? 'importAdded' : 'importDone', result))
    } catch {
      alert(t('importFailed'))
    }
  }

  return (
    <PageShell title={t('settings')}>
      <div className="space-y-5">
        <div>
          <Label>{t('playerName')}</Label>
          <input
            className="field"
            value={playerName ?? ''}
            onChange={(e) => update({ playerName: e.target.value || undefined })}
            placeholder={t('playerNamePlaceholder')}
            maxLength={24}
          />
        </div>
        <div>
          <Label>{t('language')}</Label>
          <Segmented
            value={lang}
            onChange={(v) => update({ lang: v })}
            options={[
              { value: 'he', label: 'עברית' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>
        <div>
          <Label>{t('theme')}</Label>
          <Segmented<Theme>
            value={theme}
            onChange={(v) => update({ theme: v })}
            options={[
              { value: 'system', label: t('themeSystem') },
              { value: 'light', label: `☀️ ${t('themeLight')}` },
              { value: 'dark', label: `🌙 ${t('themeDark')}` },
            ]}
          />
        </div>
        <div>
          <Label>{t('sound')}</Label>
          <Segmented
            value={sound ? 'on' : 'off'}
            onChange={(v) => update({ sound: v === 'on' })}
            options={[
              { value: 'on', label: `🔊 ${t('on')}` },
              { value: 'off', label: `🔇 ${t('off')}` },
            ]}
          />
        </div>
        <div className="card space-y-3 p-4">
          <Label>{t('backup')}</Label>
          <p className="text-sm text-text-dim">{t('backupDesc')}</p>
          <Button className="w-full" onClick={exportBackup}>
            {t('exportBackup')}
          </Button>
          <div className="flex gap-2">
            <Button
              tone="soft"
              className="flex-1"
              onClick={() => {
                modeRef.current = 'add'
                fileRef.current?.click()
              }}
            >
              {t('addFromFile')}
            </Button>
            <Button
              tone="soft"
              className="flex-1"
              onClick={() => {
                modeRef.current = 'replace'
                fileRef.current?.click()
              }}
            >
              {t('importBackup')}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              void onImport(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
        <p className="text-center text-xs text-text-dim">
          {t('dataCredit')}
          <br />
          {t('bossDataCredit')}
        </p>
      </div>
    </PageShell>
  )
}
