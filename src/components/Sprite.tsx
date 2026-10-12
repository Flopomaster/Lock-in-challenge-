import { useState } from 'react'
import { isPixelStyle, spriteUrls, type SpriteStyle } from '../lib/sprites'

interface SpriteProps {
  id?: number
  style: SpriteStyle
  size?: number
  shiny?: boolean
  dead?: boolean
  className?: string
}

export default function Sprite({ id, style, size = 56, shiny, dead, className = '' }: SpriteProps) {
  const urls = id ? spriteUrls(id, style, shiny) : []
  const key = urls.join('|')
  const [failed, setFailed] = useState({ key, count: 0 })
  const attempt = failed.key === key ? failed.count : 0
  const src = urls[attempt]

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-surface-hi font-bold text-text-dim ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        ?
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      onError={() => setFailed({ key, count: attempt + 1 })}
      className={`shrink-0 object-contain ${isPixelStyle(style) ? 'pixelated' : ''} ${dead ? 'grayscale opacity-70' : ''} ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
