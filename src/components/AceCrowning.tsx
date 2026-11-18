import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSettings, useT } from '../lib/settings'
import { playCrown } from '../lib/sound'
import type { SpriteStyle } from '../lib/sprites'
import Sprite from './Sprite'

/** A crown drops onto the new ace, with a burst of light. Tap or wait to dismiss. */
export default function AceCrowning({ speciesId, shiny, name, style, onDone }: { speciesId?: number; shiny?: boolean; name: string; style: SpriteStyle; onDone: () => void }) {
  const t = useT()
  const { sound } = useSettings()
  // Play once per crowning, even if the parent re-renders (e.g. as the run updates) mid-animation.
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })
  useEffect(() => {
    if (sound) playCrown()
    const timer = setTimeout(() => done.current(), 2600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div className="hof-stage fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center text-white animate-fade-in" onClick={onDone}>
      <div className="relative flex flex-col items-center">
        <div className="crown-burst absolute top-2 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,215,80,0.85),transparent_65%)]" />
        <div className="crown-drop relative z-10 text-6xl ace-crown">👑</div>
        <div className="hof-glow -mt-3">
          <Sprite id={speciesId} style={style} size={160} shiny={shiny} />
        </div>
        <div className="hof-rise mt-3" style={{ animationDelay: '0.7s' }}>
          <div className="hof-gold text-3xl font-black">
            <bdi>{name}</bdi>
          </div>
          <div className="mt-1 text-white/75">{t('aceCrowned')}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
