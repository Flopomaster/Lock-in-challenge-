import { getSpecies, typesInGen } from '../data/pokedex'
import { TYPE_COLORS } from '../data/types'
import { displayName, runGameName } from '../db/repository'
import type { Encounter, Run } from '../db/types'
import { isPixelStyle, spriteUrls, type SpriteStyle } from './sprites'

const W = 1080
const H = 1350

export interface TeamImageText {
  hallOfFame: string
  alive: string
  dead: string
  badges: string
  appName: string
}

function loadImage(urls: string[]): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const [url, ...rest] = urls
    if (!url) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => loadImage(rest).then(resolve)
    // A distinct URL so the service worker never hands back an opaque (canvas-tainting) cached copy.
    img.src = `${url}?cors=1`
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Renders the party as a 1080×1350 share card (Hall of Fame styling for a won run). */
export async function renderTeamImage(
  run: Run,
  party: Encounter[],
  counts: { alive: number; dead: number; badges?: string },
  style: SpriteStyle,
  text: TeamImageText,
): Promise<Blob> {
  await document.fonts?.ready
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const won = run.status === 'won'

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, won ? '#3a2a00' : '#1a1d29')
  bg.addColorStop(1, won ? '#120c00' : '#0b0d14')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Pokéball watermark
  ctx.globalAlpha = 0.06
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 36
  ctx.beginPath()
  ctx.arc(W - 120, 170, 260, 0, Math.PI * 2)
  ctx.moveTo(W - 380, 170)
  ctx.lineTo(W + 140, 170)
  ctx.stroke()
  ctx.globalAlpha = 1

  const font = (weight: number, size: number) => `${weight} ${size}px Rubik, 'Segoe UI', system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = won ? '#ffcb05' : '#ff5a36'
  ctx.font = font(700, 34)
  ctx.fillText(won ? `🏆 ${text.hallOfFame}` : runGameName(run).toUpperCase(), 80, 120)
  ctx.fillStyle = '#ffffff'
  ctx.font = font(700, 72)
  ctx.fillText(run.name, 80, 205, W - 160)
  if (won) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = font(500, 32)
    ctx.fillText(runGameName(run), 80, 255)
  }

  // Party grid: 3 × 2 cards
  const sprites = await Promise.all(party.map((e) => (e.speciesId ? loadImage(spriteUrls(e.speciesId, style, e.shiny)) : null)))
  const cardW = 290
  const cardH = 380
  const gap = 35
  const x0 = (W - (cardW * 3 + gap * 2)) / 2
  const y0 = 320
  for (let i = 0; i < 6; i++) {
    const x = x0 + (i % 3) * (cardW + gap)
    const y = y0 + Math.floor(i / 3) * (cardH + gap)
    roundRect(ctx, x, y, cardW, cardH, 36)
    ctx.fillStyle = won ? 'rgba(255,203,5,0.08)' : 'rgba(255,255,255,0.06)'
    ctx.fill()
    ctx.strokeStyle = won ? 'rgba(255,203,5,0.35)' : 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 3
    ctx.stroke()
    const e = party[i]
    if (!e) continue
    const img = sprites[i]
    if (img) {
      ctx.imageSmoothingEnabled = !isPixelStyle(style)
      ctx.drawImage(img, x + 35, y + 10, 220, 220)
      ctx.imageSmoothingEnabled = true
    }
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.font = font(700, 40)
    ctx.fillText(displayName(e), x + cardW / 2, y + 268, cardW - 30)
    const species = getSpecies(e.speciesId)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = font(500, 28)
    ctx.fillText(`${species?.name ?? ''}${e.level ? `  ·  Lv. ${e.level}` : ''}`, x + cardW / 2, y + 308, cardW - 30)
    // Type pills
    const types = species ? typesInGen(species, style.gen) : []
    const pillW = 110
    const startX = x + cardW / 2 - (types.length * pillW + (types.length - 1) * 10) / 2
    types.forEach((ty, j) => {
      const px = startX + j * (pillW + 10)
      roundRect(ctx, px, y + 328, pillW, 34, 17)
      ctx.fillStyle = TYPE_COLORS[ty] ?? '#888'
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = font(700, 18)
      ctx.fillText(ty.toUpperCase(), px + pillW / 2, y + 351)
    })
    ctx.textAlign = 'start'
  }

  // Footer stats
  const fy = 1200
  ctx.font = font(700, 40)
  const stats = [
    { label: text.alive, value: String(counts.alive), color: '#34d399' },
    { label: text.dead, value: String(counts.dead), color: '#fb7185' },
    ...(counts.badges ? [{ label: text.badges, value: counts.badges, color: '#ffcb05' }] : []),
  ]
  stats.forEach((s, i) => {
    const x = 80 + i * 300
    ctx.fillStyle = s.color
    ctx.font = font(700, 56)
    ctx.fillText(s.value, x, fy)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = font(500, 28)
    ctx.fillText(s.label, x, fy + 44)
  })
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = font(500, 24)
  ctx.textAlign = 'center'
  ctx.fillText(text.appName, W / 2, H - 30)

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'))
}
