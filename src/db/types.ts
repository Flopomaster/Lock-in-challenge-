export type Variant = 'classic' | 'hardcore' | 'soullink' | 'custom'
export type RunStatus = 'active' | 'won' | 'lost'

export interface RuleSet {
  dupes: boolean
  shiny: boolean
  nicknames: boolean
  levelCaps: boolean
  noItems: boolean
  setMode: boolean
}

export interface CustomGame {
  name: string
  gen: number
  locations: string[]
}

/** One of the Soul Link partner's Pokémon, as imported from their share code. */
export interface PartnerMon {
  speciesId?: number
  nickname?: string
  level?: number
  status: EncounterStatus
}

export interface SoulLinkPartner {
  importedAt: number
  /** Partner's encounters keyed by location — paired with ours by the same location. */
  mons: Record<string, PartnerMon>
}

export interface Run {
  id?: number
  name: string
  gameId: string
  /** Present for ROM hacks / user-defined games; overrides `gameId`'s data. */
  customGame?: CustomGame
  variant: Variant
  rules: RuleSet
  customRules: string[]
  partnerName?: string
  partner?: SoulLinkPartner
  extraLocations: string[]
  /** Manual badge count, used only for games without boss data. */
  badges: number
  /** Boss ids (from the game's data) marked as beaten. */
  defeatedBosses?: string[]
  status: RunStatus
  createdAt: number
  endedAt?: number
}

export type EncounterStatus = 'party' | 'box' | 'dead' | 'missed'

export interface Death {
  at: number
  level?: number
  killer?: string
  location?: string
  cause?: string
  epitaph?: string
}

export interface Encounter {
  id?: number
  runId: number
  location: string
  /** Absent when a missed encounter's species is unknown. */
  speciesId?: number
  status: EncounterStatus
  nickname?: string
  level?: number
  nature?: string
  ability?: string
  gender?: 'm' | 'f'
  shiny?: boolean
  notes?: string
  /** Sort key within the party / box. */
  order: number
  /** The in-game Pokémon's PID, once matched by a save-file sync. */
  pid?: number
  createdAt: number
  death?: Death
}
