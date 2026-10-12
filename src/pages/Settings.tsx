import { useRef } from 'react'
import PageShell from '../components/PageShell'
import { Button, Label, Segmented } from '../components/ui'
import { db } from '../db/db'
import { exportBackup, importBackup } from '../lib/backup'
import { useSettings, useT, type Theme } from '../lib/settings'

export default function Settings() {
  const t = useT()
  const { lang, theme, sound, currentRunId, update } = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)

  async function onImport(file: File | undefined) {
    if (!file || !confirm(t('importConfirm'))) return
    try {
      const result = await importBackup(file)
      if (currentRunId && !(await db.runs.get(currentRunId))) update({ currentRunId: undefined })
      alert(t('importDone', result))
    } catch {
      alert(t('importFailed'))
    }
  }

  return (
    <PageShell title={t('settings')}>
      <div className="space-y-5">
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
          <div className="flex gap-2">
            <Button className="flex-1" onClick={exportBackup}>
              {t('exportBackup')}
            </Button>
            <Button tone="soft" className="flex-1" onClick={() => fileRef.current?.click()}>
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
