import { useEffect, useState } from 'react'
import { useT } from '../lib/settings'
import type { SpriteStyle } from '../lib/sprites'
import Sprite from './Sprite'
import { Pokeball } from './icons'

export const CATCH_EVENT = 'nuzlocke:catch'

export interface CatchDetail {
  speciesId: number
  name: string
  shiny?: boolean
}

/** Poké Ball wobble + "Gotcha!" after logging a new catch. */
export default function CatchCelebration({ style }: { style: SpriteStyle }) {
  const t = useT()
  const [caught, setCaught] = useState<CatchDetail & { key: number }>()

  useEffect(() => {
    const onCatch = (e: Event) => setCaught({ ...(e as CustomEvent<CatchDetail>).detail, key: Date.now() })
    window.addEventListener(CATCH_EVENT, onCatch)
    return () => window.removeEventListener(CATCH_EVENT, onCatch)
  }, [])

  useEffect(() => {
    if (!caught) return
    const timer = setTimeout(() => setCaught(undefined), 2200)
    return () => clearTimeout(timer)
  }, [caught])

  if (!caught) return null
  return (
    <div key={caught.key} className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center">
      <div className="catch-ball text-text">
        <Pokeball size={72} />
      </div>
      <div className="catch-reveal absolute flex flex-col items-center">
        <Sprite id={caught.speciesId} style={style} size={120} shiny={caught.shiny} />
        <div className="card mt-2 px-4 py-2 text-center shadow-lg">
          <div className="text-lg font-bold">{t('gotcha')}</div>
          <div className="text-sm text-text-dim">
            <bdi>{caught.name}</bdi>
          </div>
        </div>
      </div>
    </div>
  )
}
