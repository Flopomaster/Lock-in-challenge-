// HeartGold / SoulSilver (.sav) reader. Layout and crypto follow PKHeX (SAV4HGSS, PK4, PokeCrypto):
// a 512 KB file with two partitions, each holding a "general" and a "storage" block; the newest
// copy of each block wins. Pokémon are 136-byte PK4 structs (236 in the party), encrypted with a
// checksum-seeded LCRNG and block-shuffled by their PID.
import gen4 from '../../data/gen4.json'
import { NATURES, getSpecies } from '../../data/pokedex'
import { levelFromExp } from '../experience'

const SAVE_SIZE = 0x80000
const PARTITION = 0x40000
const GENERAL_SIZE = 0xf628
const STORAGE_START = 0xf700
const STORAGE_SIZE = 0x12310
const PARTY_OFFSET = 0x98
const TRAINER_OFFSET = 0x64
const PARTY_SIZE = 236
const STORED_SIZE = 136
const BOXES = 18
const BOX_SLOTS = 30
const BOX_STRIDE = 0x1000
const FOOTER_SIZE = 0x10

// Block order for each shuffle value (PokeCrypto.BlockPosition; 24 permutations + 8 repeats).
const BLOCK_POSITION = [
  0, 1, 2, 3, 0, 1, 3, 2, 0, 2, 1, 3, 0, 3, 1, 2, 0, 2, 3, 1, 0, 3, 2, 1, 1, 0, 2, 3, 1, 0, 3, 2, 2, 0, 1, 3, 3, 0, 1, 2, 2, 0, 3, 1, 3, 0, 2, 1, 1, 2, 0, 3,
  1, 3, 0, 2, 2, 1, 0, 3, 3, 1, 0, 2, 2, 3, 0, 1, 3, 2, 0, 1, 1, 2, 3, 0, 1, 3, 2, 0, 2, 1, 3, 0, 3, 1, 2, 0, 2, 3, 1, 0, 3, 2, 1, 0, 0, 1, 2, 3, 0, 1, 3, 2,
  0, 2, 1, 3, 0, 3, 1, 2, 0, 2, 3, 1, 0, 3, 2, 1, 1, 0, 2, 3, 1, 0, 3, 2,
]

const JOHTO_LEADERS = ['Falkner', 'Bugsy', 'Whitney', 'Morty', 'Chuck', 'Jasmine', 'Pryce', 'Clair']
const KANTO_LEADERS = ['Brock', 'Misty', 'Surge', 'Erika', 'Janine', 'Sabrina', 'Blaine', 'Blue']

export interface SaveMon {
  pid: number
  speciesId: number
  nickname?: string
  level: number
  nature: string
  ability?: string
  gender?: 'm' | 'f'
  shiny: boolean
  metLocation: string
  inParty: boolean
  fainted: boolean
  /** Original trainer IDs (to tell which game a PC box copy belongs to). */
  otTid: number
  otSid: number
}

export interface ParsedSave {
  trainer: string
  /** Trainer ID / secret ID — identify which game a save copy belongs to. */
  tid: number
  sid: number
  party: SaveMon[]
  boxes: SaveMon[]
  /** Gym leader names whose badge is owned. */
  badges: string[]
  /** PIDs found in a PC copy that belongs to another trainer (an older game left in the file). */
  foreignPids: number[]
}

export class SaveError extends Error {}

const u16 = (d: Uint8Array, o: number) => d[o] | (d[o + 1] << 8)
const u32 = (d: Uint8Array, o: number) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0

/** CRC-16/CCITT as used by Gen 4 block footers (PKHeX Checksums.CRC16_CCITT). */
function crc16(data: Uint8Array, start: number, end: number): number {
  let top = 0xff
  let bot = 0xff
  for (let i = start; i < end; i++) {
    let x = data[i] ^ top
    x ^= x >> 4
    top = (bot ^ (x >> 3) ^ (x << 4)) & 0xff
    bot = (x ^ (x << 5)) & 0xff
  }
  return (top << 8) | bot
}

/** A block copy is usable when its stored checksum matches its contents. */
const blockValid = (data: Uint8Array, begin: number, length: number) =>
  crc16(data, begin, begin + length - FOOTER_SIZE) === u16(data, begin + length - 2)

/** Save counters (major, minor) from a block's footer: higher = written later *within one game*. */
const blockCounter = (data: Uint8Array, begin: number, length: number) =>
  u32(data, begin + length - 0x14) * 2 ** 32 + u32(data, begin + length - 0x10)

function cryptArray(data: Uint8Array, start: number, end: number, seed: number) {
  for (let i = start; i < end; i += 2) {
    seed = (Math.imul(0x41c64e6d, seed) + 0x6073) >>> 0
    const xor = seed >>> 16
    data[i] ^= xor & 0xff
    data[i + 1] ^= xor >>> 8
  }
}

/** Decrypts one PK4 (stored or party size). Returns null for empty / corrupt slots. */
function decrypt(raw: Uint8Array): Uint8Array | null {
  const data = raw.slice()
  const pid = u32(data, 0)
  const checksum = u16(data, 6)
  if (pid === 0 && checksum === 0) return null
  cryptArray(data, 8, STORED_SIZE, checksum)
  if (data.length > STORED_SIZE) cryptArray(data, STORED_SIZE, data.length, pid)
  const sv = (pid >>> 13) & 31
  const blocks = [0, 1, 2, 3].map((b) => data.slice(8 + b * 32, 8 + (b + 1) * 32))
  for (let i = 0; i < 4; i++) data.set(blocks[BLOCK_POSITION[sv * 4 + i]], 8 + i * 32)
  let sum = 0
  for (let i = 8; i < STORED_SIZE; i += 2) sum = (sum + u16(data, i)) & 0xffff
  return sum === checksum ? data : null
}

function decodeString(data: Uint8Array, offset: number, maxChars: number): string {
  let out = ''
  for (let i = 0; i < maxChars; i++) {
    const v = u16(data, offset + i * 2)
    if (v === 0xffff || v === 0) break
    const ch = gen4.chars[v - gen4.charStart]
    out += ch && ch !== '\0' ? ch : '?'
  }
  return out
}

function readMon(raw: Uint8Array, tid: number, sid: number, inParty: boolean): SaveMon | null {
  const d = decrypt(raw)
  if (!d) return null
  const speciesId = u16(d, 0x08)
  const iv32 = u32(d, 0x38)
  const isEgg = ((iv32 >>> 30) & 1) === 1
  if (!speciesId || isEgg || !getSpecies(speciesId)) return null

  const pid = u32(d, 0)
  const genderBits = (d[0x40] >>> 1) & 3
  const met = u16(d, 0x46) || u16(d, 0x80)
  const shinyValue = (tid ^ sid ^ (pid >>> 16) ^ (pid & 0xffff)) >>> 0
  const level = inParty && d.length > 0x8c && d[0x8c] ? d[0x8c] : levelFromExp(getSpecies(speciesId)!.growth, u32(d, 0x10))

  return {
    pid,
    speciesId,
    nickname: iv32 >>> 31 ? decodeString(d, 0x48, 11) : undefined,
    level,
    nature: NATURES[pid % 25],
    ability: gen4.abilities[d[0x15]] || undefined,
    gender: genderBits === 0 ? 'm' : genderBits === 1 ? 'f' : undefined,
    shiny: shinyValue < 8,
    metLocation: (gen4.locations as Record<string, string>)[met] ?? `#${met}`,
    inParty,
    fainted: inParty && u16(d, 0x8e) === 0,
    otTid: u16(d, 0x0c),
    otSid: u16(d, 0x0e),
  }
}

function readBoxes(data: Uint8Array, storage: number, tid: number, sid: number): SaveMon[] {
  const boxes: SaveMon[] = []
  for (let b = 0; b < BOXES; b++) {
    for (let s = 0; s < BOX_SLOTS; s++) {
      const at = storage + b * BOX_STRIDE + s * STORED_SIZE
      const mon = readMon(data.subarray(at, at + STORED_SIZE), tid, sid, false)
      if (mon) boxes.push(mon)
    }
  }
  return boxes
}

/**
 * Returns the game(s) in the save, newest first. A DS save keeps two copies of every block, chosen
 * by a save counter — but starting a New Game restarts that counter, so a copy of an *older* game
 * can outrank the current one. Each valid copy is therefore read on its own, and copies from
 * different trainers come back as separate candidates for the player (or a remembered ID) to pick.
 */
export function parseHgssSave(file: ArrayBuffer): ParsedSave[] {
  // Emulators may append a footer (e.g. DeSmuME); the save proper is the first 512 KB.
  if (file.byteLength < SAVE_SIZE) throw new SaveError('size')
  const data = new Uint8Array(file, 0, SAVE_SIZE)

  const generals = [0, PARTITION].filter(
    (base) => u32(data, base + GENERAL_SIZE - 0xc) === GENERAL_SIZE && blockValid(data, base, GENERAL_SIZE),
  )
  if (!generals.length) throw new SaveError('format')
  const storages = [STORAGE_START, STORAGE_START + PARTITION].filter((base) => blockValid(data, base, STORAGE_SIZE))

  const candidates = generals.map((general) => {
    const trainer = decodeString(data, general + TRAINER_OFFSET, 8)
    const tid = u16(data, general + TRAINER_OFFSET + 0x10)
    const sid = u16(data, general + TRAINER_OFFSET + 0x12)

    const partyCount = Math.min(6, data[general + PARTY_OFFSET - 4])
    const party: SaveMon[] = []
    for (let i = 0; i < partyCount; i++) {
      const at = general + PARTY_OFFSET + i * PARTY_SIZE
      const mon = readMon(data.subarray(at, at + PARTY_SIZE), tid, sid, true)
      if (mon) party.push(mon)
    }

    // The PC copy that belongs to this trainer. HGSS only rewrites the PC block when boxes change,
    // so after a New Game one copy can still hold the *previous* game's boxes — with a higher save
    // counter. A copy with Pokémon but none caught by this trainer is that leftover: skip it.
    const ownCount = (mons: SaveMon[]) => mons.filter((m) => m.otTid === tid && m.otSid === sid).length
    const boxOptions = storages.map((base) => ({ base, boxes: readBoxes(data, base, tid, sid) }))
    const foreign = boxOptions.filter((o) => o.boxes.length > 0 && ownCount(o.boxes) === 0)
    const boxes =
      boxOptions
        .filter((o) => !foreign.includes(o))
        .sort((a, b) => ownCount(b.boxes) - ownCount(a.boxes) || blockCounter(data, b.base, STORAGE_SIZE) - blockCounter(data, a.base, STORAGE_SIZE))[0]
        ?.boxes ?? []
    const foreignPids = foreign.flatMap((o) => o.boxes.map((m) => m.pid))

    const johto = data[general + TRAINER_OFFSET + 0x1a]
    const kanto = data[general + TRAINER_OFFSET + 0x1f]
    const badges = [
      ...JOHTO_LEADERS.filter((_, i) => johto & (1 << i)),
      ...KANTO_LEADERS.filter((_, i) => kanto & (1 << i)),
    ]
    return { save: { trainer, tid, sid, party, boxes, badges, foreignPids }, counter: blockCounter(data, general, GENERAL_SIZE) }
  })

  // Two copies of the same game: keep the newer one.
  candidates.sort((a, b) => b.counter - a.counter)
  const unique = candidates.filter((c, i) => candidates.findIndex((o) => o.save.tid === c.save.tid && o.save.sid === c.save.sid) === i)
  return unique.map((c) => c.save)
}

/** A short, pasteable text report of every block copy in the file — for debugging saves remotely. */
export function diagnoseHgssSave(file: ArrayBuffer): string {
  const lines = [`size ${file.byteLength} (0x${file.byteLength.toString(16)})`]
  if (file.byteLength < SAVE_SIZE) return lines.join('\n')
  const data = new Uint8Array(file, 0, SAVE_SIZE)
  const name = (id: number) => getSpecies(id)?.name ?? `#${id}`
  for (const [i, base] of [0, PARTITION].entries()) {
    const g = base
    const tid = u16(data, g + TRAINER_OFFSET + 0x10)
    const sid = u16(data, g + TRAINER_OFFSET + 0x12)
    const partyCount = data[g + PARTY_OFFSET - 4]
    const party: string[] = []
    for (let p = 0; p < Math.min(6, partyCount); p++) {
      const at = g + PARTY_OFFSET + p * PARTY_SIZE
      const mon = readMon(data.subarray(at, at + PARTY_SIZE), tid, sid, true)
      party.push(mon ? `${name(mon.speciesId)}${mon.level}@${mon.metLocation}` : 'x')
    }
    lines.push(
      `G${i}: sizeOk=${u32(data, g + GENERAL_SIZE - 0xc) === GENERAL_SIZE} crc=${blockValid(data, g, GENERAL_SIZE)} ctr=${u32(data, g + GENERAL_SIZE - 0x14)}/${u32(data, g + GENERAL_SIZE - 0x10)} ` +
        `tr=${decodeString(data, g + TRAINER_OFFSET, 8)} id=${tid}/${sid} badges=${data[g + TRAINER_OFFSET + 0x1a]}/${data[g + TRAINER_OFFSET + 0x1f]} n=${partyCount} [${party.join(', ')}]`,
    )
    const s = base + STORAGE_START
    const boxes = readBoxes(data, s, tid, sid)
    const owners = new Map<string, number>()
    for (const m of boxes) owners.set(`${m.otTid}/${m.otSid}`, (owners.get(`${m.otTid}/${m.otSid}`) ?? 0) + 1)
    lines.push(
      `S${i}: crc=${blockValid(data, s, STORAGE_SIZE)} ctr=${u32(data, s + STORAGE_SIZE - 0x14)}/${u32(data, s + STORAGE_SIZE - 0x10)} mons=${boxes.length} ot={${[...owners].map(([k, v]) => `${k}:${v}`).join(' ')}} ` +
        `[${boxes.slice(0, 8).map((m) => `${name(m.speciesId)}${m.level}`).join(', ')}]`,
    )
  }
  try {
    lines.push(`picked: ${parseHgssSave(file).map((g) => `${g.trainer} ${g.tid}/${g.sid} party=${g.party.length} box=${g.boxes.length} foreign=${g.foreignPids.length}`).join(' | ')}`)
  } catch (e) {
    lines.push(`parse error: ${(e as Error).message}`)
  }
  return lines.join('\n')
}
