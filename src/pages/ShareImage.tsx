import { useEffect, useState } from 'react'
import { Button } from '../components/ui'
import { byOrder } from '../db/hooks'
import { runMaxBadges } from '../db/repository'
import { gymCount, isDefeated } from '../lib/bosses'
import { useRun } from '../lib/runContext'
import { useT } from '../lib/settings'
import { spriteStyleForRun } from '../lib/sprites'
import { renderTeamImage } from '../lib/teamImage'

export default function ShareImage() {
  const t = useT()
  const { run, encounters, data } = useRun()
  const [blob, setBlob] = useState<Blob>()
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    let alive = true
    const party = encounters.filter((e) => e.status === 'party').sort(byOrder)
    const gyms = gymCount(data)
    const badges = gyms
      ? `${data!.bosses.filter((b) => b.type === 'gym-leader' && isDefeated(run, b)).length}/${gyms}`
      : runMaxBadges(run)
        ? `${run.badges}/${runMaxBadges(run)}`
        : undefined
    void renderTeamImage(
      run,
      party,
      {
        alive: encounters.filter((e) => e.status === 'party' || e.status === 'box').length,
        dead: encounters.filter((e) => e.status === 'dead').length,
        badges,
      },
      spriteStyleForRun(run),
      { hallOfFame: t('hallOfFame'), alive: t('alive'), dead: t('dead'), badges: t('badges'), appName: t('appName') },
    ).then((b) => {
      if (!alive) return
      setBlob(b)
      setUrl(URL.createObjectURL(b))
    })
    return () => {
      alive = false
    }
    // Re-render only when the run's data changes, not on every translation function identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, encounters, data])

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )

  const fileName = `${run.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.png`

  async function share() {
    if (!blob) return
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: run.name })
        return
      } catch {
        // Dismissed — nothing to do.
        return
      }
    }
    download()
  }

  function download() {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
  }

  return (
    <div className="animate-rise-in space-y-4">
      <div className="card overflow-hidden">
        {url ? <img src={url} alt={run.name} className="block w-full" /> : <div className="aspect-[4/5] animate-pulse bg-surface-hi" />}
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={share} disabled={!blob}>
          {t('shareTeam')}
        </Button>
        <Button tone="soft" className="flex-1" onClick={download} disabled={!blob}>
          {t('download')}
        </Button>
      </div>
    </div>
  )
}
