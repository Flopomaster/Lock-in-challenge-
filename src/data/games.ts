// Game registry. Route lists and boss data for most games are generated into
// ./games/<id>.json (see scripts/build-games.py) and loaded lazily per run.

export interface Game {
  id: string
  name: string
  gen: number
  /** Path under PokeAPI's sprites repo (`sprites/pokemon/versions/...`); absent = default sprites. */
  sprites?: string
  badges: number
  /** ROM hacks: any species may appear. */
  hack?: boolean
  /** PokeAPI version group whose learnsets apply (ROM hacks use their base game's). */
  learnset?: string
  /** Fallback location list for games without generated data. */
  locations?: string[]
}

const KANTO = [
  'Pallet Town',
  'Route 1',
  'Viridian City',
  'Route 22',
  'Route 2',
  'Viridian Forest',
  'Pewter City',
  'Route 3',
  'Mt. Moon',
  'Route 4',
  'Cerulean City',
  'Route 24',
  'Route 25',
  'Route 5',
  'Route 6',
  'Vermilion City',
  'S.S. Anne',
  'Route 11',
  "Diglett's Cave",
  'Route 9',
  'Route 10',
  'Rock Tunnel',
  'Route 8',
  'Route 7',
  'Celadon City',
  'Pokémon Tower',
  'Saffron City',
  'Route 12',
  'Route 13',
  'Route 14',
  'Route 15',
  'Route 16',
  'Route 17',
  'Route 18',
  'Fuchsia City',
  'Safari Zone',
  'Route 19',
  'Route 20',
  'Seafoam Islands',
  'Cinnabar Island',
  'Pokémon Mansion',
  'Route 21',
  'Power Plant',
  'Route 23',
  'Victory Road',
  'Cerulean Cave',
]

export const GAMES: Game[] = [
  { id: 'red-blue', name: 'Red / Blue', gen: 1, sprites: 'generation-i/red-blue/transparent', badges: 8, learnset: 'red-blue' },
  { id: 'yellow', name: 'Yellow', gen: 1, sprites: 'generation-i/yellow/transparent', badges: 8, learnset: 'yellow' },
  { id: 'gold-silver', name: 'Gold / Silver', gen: 2, sprites: 'generation-ii/gold/transparent', badges: 16, learnset: 'gold-silver' },
  { id: 'crystal', name: 'Crystal', gen: 2, sprites: 'generation-ii/crystal/transparent', badges: 16, learnset: 'crystal' },
  { id: 'ruby-sapphire', name: 'Ruby / Sapphire', gen: 3, sprites: 'generation-iii/ruby-sapphire', badges: 8, learnset: 'ruby-sapphire' },
  { id: 'emerald', name: 'Emerald', gen: 3, sprites: 'generation-iii/emerald', badges: 8, learnset: 'emerald' },
  { id: 'firered-leafgreen', name: 'FireRed / LeafGreen', gen: 3, sprites: 'generation-iii/firered-leafgreen', badges: 8, learnset: 'firered-leafgreen' },
  { id: 'diamond-pearl', name: 'Diamond / Pearl', gen: 4, sprites: 'generation-iv/diamond-pearl', badges: 8, learnset: 'diamond-pearl' },
  { id: 'platinum', name: 'Platinum', gen: 4, sprites: 'generation-iv/platinum', badges: 8, learnset: 'platinum' },
  { id: 'heartgold-soulsilver', name: 'HeartGold / SoulSilver', gen: 4, sprites: 'generation-iv/heartgold-soulsilver', badges: 16, learnset: 'heartgold-soulsilver' },
  { id: 'black-white', name: 'Black / White', gen: 5, sprites: 'generation-v/black-white', badges: 8, learnset: 'black-white' },
  { id: 'black2-white2', name: 'Black 2 / White 2', gen: 5, sprites: 'generation-v/black-white', badges: 8, learnset: 'black-2-white-2' },
  { id: 'x-y', name: 'X / Y', gen: 6, sprites: 'generation-vi/x-y', badges: 8, learnset: 'x-y' },
  { id: 'oras', name: 'Omega Ruby / Alpha Sapphire', gen: 6, sprites: 'generation-vi/x-y', badges: 8, learnset: 'omega-ruby-alpha-sapphire' },
  { id: 'sun-moon', name: 'Sun / Moon', gen: 7, badges: 0, learnset: 'sun-moon' },
  { id: 'usum', name: 'Ultra Sun / Ultra Moon', gen: 7, badges: 0, learnset: 'ultra-sun-ultra-moon' },
  { id: 'lgpe', name: "Let's Go Pikachu / Eevee", gen: 7, badges: 8, locations: KANTO, learnset: 'lets-go-pikachu-lets-go-eevee' },
  { id: 'sword-shield', name: 'Sword / Shield', gen: 8, badges: 8, learnset: 'sword-shield' },
  { id: 'bdsp', name: 'Brilliant Diamond / Shining Pearl', gen: 8, badges: 8, learnset: 'brilliant-diamond-shining-pearl' },
  { id: 'scarlet-violet', name: 'Scarlet / Violet', gen: 9, badges: 8, learnset: 'scarlet-violet' },
  // ROM hacks
  { id: 'radical-red', name: 'Radical Red', gen: 3, sprites: 'generation-iii/firered-leafgreen', badges: 8, hack: true, learnset: 'firered-leafgreen' },
  { id: 'unbound', name: 'Unbound', gen: 3, sprites: 'generation-iii/emerald', badges: 8, hack: true, learnset: 'emerald' },
  { id: 'emerald-kaizo', name: 'Emerald Kaizo', gen: 3, sprites: 'generation-iii/emerald', badges: 8, hack: true, learnset: 'emerald' },
  { id: 'run-and-bun', name: 'Run & Bun', gen: 3, sprites: 'generation-iii/emerald', badges: 8, hack: true, learnset: 'emerald' },
  { id: 'inclement-emerald', name: 'Inclement Emerald', gen: 3, sprites: 'generation-iii/emerald', badges: 8, hack: true, learnset: 'emerald' },
  { id: 'blazing-emerald', name: 'Blazing Emerald', gen: 3, sprites: 'generation-iii/emerald', badges: 8, hack: true, learnset: 'emerald' },
  { id: 'glazed', name: 'Glazed', gen: 3, sprites: 'generation-iii/emerald', badges: 8, hack: true, learnset: 'emerald' },
  { id: 'rising-ruby', name: 'Rising Ruby / Sinking Sapphire', gen: 3, sprites: 'generation-iii/ruby-sapphire', badges: 8, hack: true, learnset: 'ruby-sapphire' },
  { id: 'renegade-platinum', name: 'Renegade Platinum', gen: 4, sprites: 'generation-iv/platinum', badges: 8, hack: true, learnset: 'platinum' },
  { id: 'sacred-gold', name: 'Sacred Gold / Storm Silver', gen: 4, sprites: 'generation-iv/heartgold-soulsilver', badges: 16, hack: true, learnset: 'heartgold-soulsilver' },
  { id: 'blaze-black', name: 'Blaze Black / Volt White', gen: 5, sprites: 'generation-v/black-white', badges: 8, hack: true, learnset: 'black-white' },
  { id: 'blaze-black-2', name: 'Blaze Black 2 / Volt White 2', gen: 5, sprites: 'generation-v/black-white', badges: 8, hack: true, learnset: 'black-2-white-2' },
  { id: 'insurgence', name: 'Insurgence', gen: 6, badges: 8, hack: true, learnset: 'x-y' },
]

/** Sprite folder used for custom games / ROM hacks, keyed by generation. */
export const GEN_SPRITES: Record<number, string | undefined> = {
  1: 'generation-i/red-blue/transparent',
  2: 'generation-ii/crystal/transparent',
  3: 'generation-iii/emerald',
  4: 'generation-iv/platinum',
  5: 'generation-v/black-white',
  6: 'generation-vi/x-y',
}

/** Highest national dex number introduced by each generation. */
export const GEN_MAX_DEX = [0, 151, 251, 386, 493, 649, 721, 809, 905, 1025]

export function getGame(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id)
}
