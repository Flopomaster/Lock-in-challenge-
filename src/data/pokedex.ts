import raw from './pokedex.json'

export interface Species {
  id: number
  name: string
  gen: number
  types: string[]
  chain: number
  stats: number[]
  abilities: string[]
  pastTypes?: { gen: number; types: string[] }[]
}

export const POKEDEX = raw as Species[]

export function getSpecies(id: number | undefined): Species | undefined {
  return id ? POKEDEX[id - 1] : undefined
}

/** Types as they were in the given generation (e.g. Clefairy is Normal before Gen 6). */
export function typesInGen(species: Species, gen: number): string[] {
  const past = species.pastTypes?.filter((p) => gen <= p.gen).sort((a, b) => a.gen - b.gen)[0]
  return past ? past.types : species.types
}

/** Every species in the same evolution family. */
export function evolutionFamily(species: Species): Species[] {
  return POKEDEX.filter((s) => s.chain === species.chain)
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')

const INDEX = POKEDEX.map((s) => normalize(s.name))

export function searchSpecies(query: string, maxDex = POKEDEX.length, limit = 40): Species[] {
  const q = normalize(query)
  const asNumber = Number(query.trim())
  if (Number.isInteger(asNumber) && asNumber > 0) {
    const s = getSpecies(asNumber)
    return s && s.id <= maxDex ? [s] : []
  }
  const starts: Species[] = []
  const contains: Species[] = []
  for (let i = 0; i < maxDex; i++) {
    if (!q || INDEX[i].startsWith(q)) starts.push(POKEDEX[i])
    else if (INDEX[i].includes(q)) contains.push(POKEDEX[i])
    if (starts.length >= limit) break
  }
  return [...starts, ...contains].slice(0, limit)
}

export const NATURES = [
  'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
  'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
  'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
  'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
  'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky',
]

export const prettyAbility = (slug: string) =>
  slug
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
