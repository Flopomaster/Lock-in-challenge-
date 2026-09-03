import { useEffect, useState } from 'react'
import { LogoMark } from './icons'

export default function Splash({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 2000)
    return () => clearTimeout(hide)
  }, [])

  useEffect(() => {
    if (!visible) onDone()
  }, [visible, onDone])

  if (!visible) return null

  return (
    <div
      className="splash-screen fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-bg"
      onAnimationEnd={(e) => {
        if (e.animationName === 'splash-out') setVisible(false)
      }}
    >
      <div className="relative flex items-center justify-center">
        <svg width="112" height="112" viewBox="0 0 112 112" className="absolute -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="40"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="251"
            className="splash-ring"
          />
        </svg>
        <div className="splash-logo">
          <LogoMark size={72} />
        </div>
      </div>
      <div className="splash-text text-sm font-bold text-text-dim uppercase">Lock In</div>
    </div>
  )
}
