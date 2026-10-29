import { GEN_MAX_DEX, GEN_SPRITES, getGame } from '../data/games'
import type { Run } from '../db/types'

const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export interface SpriteStyle {
  folder?: string
  gen: number
}

export function spriteStyleForRun(run: Run | undefined): SpriteStyle {
  if (!run) return { gen: 9 }
  if (run.customGame) return { folder: GEN_SPRITES[run.customGame.gen], gen: run.customGame.gen }
  const game = getGame(run.gameId)
  return { folder: game?.sprites, gen: game?.gen ?? 9 }
}

/** Sprite style for a game id alone (Hall of Fame entries outlive their runs). */
export function spriteStyleForGameId(gameId: string): SpriteStyle {
  const game = getGame(gameId)
  return { folder: game?.sprites, gen: game?.gen ?? 9 }
}

/**
 * Candidate URLs, best first: the game-accurate sprite when the species existed in that
 * generation, then the modern sprite as a fallback (e.g. Gen 1 has no shiny sprites).
 */
export function spriteUrls(id: number, style: SpriteStyle, shiny = false, formId?: number): string[] {
  const s = shiny ? 'shiny/' : ''
  const urls: string[] = []
  // Regional / alternate forms only have modern sprites.
  if (formId) urls.push(`${BASE}/${s}${formId}.png`)
  if (style.folder && id <= GEN_MAX_DEX[style.gen] && !(shiny && style.gen === 1)) {
    urls.push(`${BASE}/versions/${style.folder}/${s}${id}.png`)
  }
  urls.push(`${BASE}/${s}${id}.png`)
  if (shiny) urls.push(`${BASE}/${id}.png`)
  return urls
}

/** Old games' sprites are tiny pixel art that must not be smoothed when scaled up. */
export const isPixelStyle = (style: SpriteStyle) => !!style.folder && style.gen <= 5
