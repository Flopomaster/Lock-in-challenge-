import { useEffect, useState, type CSSProperties } from 'react'

const COLORS = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-good)', 'var(--color-warn)']

interface Particle {
  id: number
  angle: number
  dist: number
  color: string
  delay: number
  size: number
}

/** Renders a one-shot radial confetti burst whenever `burstKey` changes (skips the initial value). */
export function ConfettiBurst({ burstKey, count = 18 }: { burstKey: number; count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (burstKey === 0) return
    const next = Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (360 / count) * i + (Math.random() * 24 - 12),
      dist: 36 + Math.random() * 34,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 90,
      size: 5 + Math.random() * 4,
    }))
    setParticles(next)
    const t = setTimeout(() => setParticles([]), 750)
    return () => clearTimeout(t)
  }, [burstKey, count])

  if (particles.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-particle absolute top-1/2 left-1/2 rounded-sm"
          style={
            {
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
              '--angle': `${p.angle}deg`,
              '--dist': `${p.dist}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}
