import { getSpecies } from '../../data/pokedex'
import { db } from '../../db/db'
import { saveEncounter } from '../../db/repository'
import type { Encounter, Run } from '../../db/types'
import type { Boss } from '../../data/gameData'
import type { ParsedSave, SaveMon } from './hgss'

/** Games whose saves the HGSS reader understands. */
export const SAVE_SYNC_GAMES = ['heartgold-soulsilver', 'sacred-gold']

// In-game met-location names that the route list spells differently.
const LOCATION_ALIASES: Record<string, string> = { teamrocketHQ: 'Rocket Hideout' }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const chainOf = (id: number | undefined) => getSpecies(id)?.chain

export interface NewCatch {
  mon: SaveMon
  /** The run location the met location maps to. */
  location: string
  /** That location already has an encounter (gift, second catch, …): off by default. */
  taken: boolean
}

export interface Update {
  encounter: Encounter
  mon: SaveMon
  changes: { kind: 'level' | 'evolved' | 'nickname' | 'moved'; from: string; to: string }[]
}

export interface SyncPlan {
  trainer: string
  saveTrainer: { tid: number; sid: number }
  newCatches: NewCatch[]
  updates: Update[]
  /** Tracked as alive but no longer in the save — released after dying? */
  missing: Encounter[]
  /** Imported earlier from the *other* game in the file (an old save left over from a New Game). */
  wrongGame: Encounter[]
  newBadges: Boss[]
  fainted: SaveMon[]
}

export function planSync(
  save: ParsedSave,
  run: Run,
  encounters: Encounter[],
  locations: string[],
  bosses: Boss[],
  otherGames: ParsedSave[] = [],
): SyncPlan {
  const otherPids = new Set([...otherGames.flatMap((g) => [...g.party, ...g.boxes]).map((m) => m.pid), ...save.foreignPids])
  const ownPids = new Set([...save.party, ...save.boxes].map((m) => m.pid))
  // Linked to the other game by an earlier sync: forget that link and match them afresh. Ones that
  // match a Pokémon in this game are the player's own and get fixed; the rest are offered for removal.
  // Switching to a different trainer than the last sync (e.g. the wrong file was read before) puts
  // everything linked to that earlier save in the same bucket.
  const trainerChanged = !!run.saveTrainer && (run.saveTrainer.tid !== save.tid || run.saveTrainer.sid !== save.sid)
  const relinked = new Set(
    encounters.filter((e) => e.pid !== undefined && !ownPids.has(e.pid) && (trainerChanged || otherPids.has(e.pid))),
  )
  encounters = encounters.map((e) => (relinked.has(e) ? { ...e, pid: undefined } : e))

  const all = [...save.party, ...save.boxes]
  const unmatched = new Set(all)
  const matches = new Map<Encounter, SaveMon>()

  const locationByNorm = new Map(locations.map((l) => [norm(l), l]))
  const runLocationFor = (met: string) => locationByNorm.get(norm(met)) ?? LOCATION_ALIASES[norm(met)] ?? met

  // 1. Already linked by PID.
  for (const e of encounters) {
    if (e.pid === undefined) continue
    const mon = all.find((m) => m.pid === e.pid)
    if (mon) {
      matches.set(e, mon)
      unmatched.delete(mon)
    }
  }
  // 2. First sync: same evolution family, preferring the same place, then the same nickname.
  const caught = encounters.filter((e) => e.status !== 'missed' && !matches.has(e) && e.pid === undefined)
  const strategies: ((e: Encounter, m: SaveMon) => boolean)[] = [
    (e, m) => runLocationFor(m.metLocation) === e.location,
    (e, m) => !!e.nickname && !!m.nickname && norm(e.nickname) === norm(m.nickname),
    () => true,
  ]
  for (const matchesStrategy of strategies) {
    for (const e of caught) {
      if (matches.has(e)) continue
      const mon = [...unmatched].find((m) => chainOf(m.speciesId) === chainOf(e.speciesId) && matchesStrategy(e, m))
      if (mon) {
        matches.set(e, mon)
        unmatched.delete(mon)
      }
    }
  }

  const updates: Update[] = []
  for (const [e, mon] of matches) {
    if (e.status === 'dead') continue
    const changes: Update['changes'] = []
    if (mon.speciesId !== e.speciesId)
      changes.push({ kind: 'evolved', from: getSpecies(e.speciesId)?.name ?? '?', to: getSpecies(mon.speciesId)?.name ?? '?' })
    if (mon.level !== e.level) changes.push({ kind: 'level', from: String(e.level ?? '?'), to: String(mon.level) })
    if (mon.nickname && mon.nickname !== e.nickname) changes.push({ kind: 'nickname', from: e.nickname ?? '', to: mon.nickname })
    const status = mon.inParty ? 'party' : 'box'
    if (status !== e.status) changes.push({ kind: 'moved', from: e.status, to: status })
    if (changes.length || e.pid === undefined) updates.push({ encounter: e, mon, changes })
  }

  // Only the first Pokémon met at a free place is its encounter; later ones (gifts, extra catches) start unchecked.
  const taken = new Set(encounters.map((e) => e.location))
  const newCatches = [...unmatched].map((mon) => {
    const location = runLocationFor(mon.metLocation)
    const catchTaken = taken.has(location)
    taken.add(location)
    return { mon, location, taken: catchTaken }
  })

  const wrongGame = encounters.filter((e) => e.pid === undefined && !matches.has(e) && [...relinked].some((r) => r.id === e.id))
  const missing = encounters.filter((e) => (e.status === 'party' || e.status === 'box') && !matches.has(e) && !wrongGame.includes(e))

  const defeated = new Set(run.defeatedBosses ?? [])
  const newBadges = bosses.filter(
    (b) => b.type === 'gym-leader' && !defeated.has(b.id) && save.badges.some((leader) => b.name.toLowerCase().includes(leader.toLowerCase())),
  )

  return { trainer: save.trainer, wrongGame, saveTrainer: { tid: save.tid, sid: save.sid }, newCatches, updates, missing, newBadges, fainted: save.party.filter((m) => m.fainted) }
}

export interface SyncSelection {
  newCatches: Set<NewCatch>
  missing: Set<Encounter>
  wrongGame: Set<Encounter>
}

export async function applySync(run: Run, plan: SyncPlan, selection: SyncSelection) {
  const extraLocations = new Set(run.extraLocations)
  const now = Date.now()

  for (const { encounter: e, mon } of plan.updates) {
    await saveEncounter({
      ...e,
      pid: mon.pid,
      speciesId: mon.speciesId,
      level: mon.level,
      nickname: mon.nickname ?? e.nickname,
      status: mon.inParty ? 'party' : 'box',
      nature: e.nature ?? mon.nature,
      ability: e.ability ?? mon.ability,
      gender: e.gender ?? mon.gender,
      shiny: e.shiny || mon.shiny || undefined,
    })
  }

  for (const c of plan.newCatches) {
    if (!selection.newCatches.has(c)) continue
    // A second Pokémon from an already-used place gets its own row ("Route 32 (2)").
    let location = c.location
    for (let n = 2; c.taken && (await db.encounters.where({ runId: run.id!, location }).count()); n++) location = `${c.location} (${n})`
    extraLocations.add(location)
    await saveEncounter({
      runId: run.id!,
      location,
      pid: c.mon.pid,
      speciesId: c.mon.speciesId,
      status: c.mon.inParty ? 'party' : 'box',
      nickname: c.mon.nickname,
      level: c.mon.level,
      nature: c.mon.nature,
      ability: c.mon.ability,
      gender: c.mon.gender,
      shiny: c.mon.shiny || undefined,
      order: 0,
      createdAt: now,
    })
  }

  if (selection.wrongGame.size) await db.encounters.bulkDelete([...selection.wrongGame].map((e) => e.id!))

  for (const e of plan.missing) {
    if (selection.missing.has(e)) await db.encounters.update(e.id!, { status: 'dead', death: { at: now } })
  }

  await db.runs.update(run.id!, {
    saveTrainer: plan.saveTrainer,
    defeatedBosses: [...new Set([...(run.defeatedBosses ?? []), ...plan.newBadges.map((b) => b.id)])],
    extraLocations: [...extraLocations],
  })
}
