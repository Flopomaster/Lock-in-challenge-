export const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

// Modern (Gen 6+) chart: attacker -> defender -> multiplier (1 when absent).
const CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

export function typesForGen(gen: number): string[] {
  if (gen === 1) return TYPES.filter((t) => t !== 'dark' && t !== 'steel' && t !== 'fairy')
  if (gen < 6) return TYPES.filter((t) => t !== 'fairy')
  return TYPES
}

/** Damage multiplier of one attacking type against one defending type, as of that generation. */
export function effectiveness(attack: string, defend: string, gen: number): number {
  if (gen < 6) {
    // Steel resisted Ghost and Dark until Gen 6.
    if (defend === 'steel' && (attack === 'ghost' || attack === 'dark')) return 0.5
  }
  if (gen === 1) {
    if (attack === 'ghost' && defend === 'psychic') return 0
    if (attack === 'bug' && defend === 'poison') return 2
    if (attack === 'poison' && defend === 'bug') return 2
    if (attack === 'ice' && defend === 'fire') return 1
  }
  return CHART[attack]?.[defend] ?? 1
}

export function multiplier(attack: string, defenders: string[], gen: number): number {
  return defenders.reduce((m, d) => m * effectiveness(attack, d, gen), 1)
}

/** Attacking types that hit this type combination super-effectively. */
export function weaknesses(defenders: string[], gen: number): { type: string; x: number }[] {
  return typesForGen(gen)
    .map((type) => ({ type, x: multiplier(type, defenders, gen) }))
    .filter((w) => w.x > 1)
    .sort((a, b) => b.x - a.x)
}
