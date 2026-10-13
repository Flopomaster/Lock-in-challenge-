// Experience curves (by PokeAPI growth rate code, see scripts/build-pokedex.py), used to derive the
// level of boxed Pokémon, whose save data stores only total EXP.

function expForLevel(growth: string, n: number): number {
  if (n <= 1) return 0
  const n3 = n ** 3
  switch (growth) {
    case 'f':
      return Math.floor((4 * n3) / 5)
    case 'm':
      return n3
    case 'p':
      return Math.floor((6 / 5) * n3 - 15 * n * n + 100 * n - 140)
    case 's':
      return Math.floor((5 * n3) / 4)
    case 'e':
      if (n < 50) return Math.floor((n3 * (100 - n)) / 50)
      if (n < 68) return Math.floor((n3 * (150 - n)) / 100)
      if (n < 98) return Math.floor((n3 * Math.floor((1911 - 10 * n) / 3)) / 500)
      return Math.floor((n3 * (160 - n)) / 100)
    case 'l':
      if (n < 15) return Math.floor((n3 * (Math.floor((n + 1) / 3) + 24)) / 50)
      if (n < 36) return Math.floor((n3 * (n + 14)) / 50)
      return Math.floor((n3 * (Math.floor(n / 2) + 32)) / 50)
    default:
      return n3
  }
}

export function levelFromExp(growth: string, exp: number): number {
  let level = 1
  while (level < 100 && expForLevel(growth, level + 1) <= exp) level++
  return level
}
