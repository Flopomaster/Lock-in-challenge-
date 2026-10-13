// Round-trip test for the HGSS save reader: builds a synthetic .sav with PKHeX's *encrypt*
// direction (BlockPositionInvert shuffle, then LCRNG xor) and checks the reader recovers it.
// Run: npx tsx scripts/tests/hgss-save.test.ts
import assert from 'node:assert/strict'
import gen4 from '../../src/data/gen4.json'
import { levelFromExp } from '../../src/lib/experience'
import { parseHgssSave } from '../../src/lib/saves/hgss'

// Experience curves against Bulbapedia's tables.
assert.equal(levelFromExp('p', 972), 11)
assert.equal(levelFromExp('p', 973), 12)
assert.equal(levelFromExp('m', 1_000_000), 100)
assert.equal(levelFromExp('e', 600_000), 100)
assert.equal(levelFromExp('l', 1_640_000), 100)
assert.equal(levelFromExp('s', 1_250_000), 100)
assert.equal(levelFromExp('f', 800_000), 100)
assert.equal(levelFromExp('f', 799_999), 99)

const INVERT = [0, 1, 2, 4, 3, 5, 6, 7, 12, 18, 13, 19, 8, 10, 14, 20, 16, 22, 9, 11, 15, 21, 17, 23, 0, 1, 2, 4, 3, 5, 6, 7]
const POS = [
  0, 1, 2, 3, 0, 1, 3, 2, 0, 2, 1, 3, 0, 3, 1, 2, 0, 2, 3, 1, 0, 3, 2, 1, 1, 0, 2, 3, 1, 0, 3, 2, 2, 0, 1, 3, 3, 0, 1, 2, 2, 0, 3, 1, 3, 0, 2, 1, 1, 2, 0, 3,
  1, 3, 0, 2, 2, 1, 0, 3, 3, 1, 0, 2, 2, 3, 0, 1, 3, 2, 0, 1, 1, 2, 3, 0, 1, 3, 2, 0, 2, 1, 3, 0, 3, 1, 2, 0, 2, 3, 1, 0, 3, 2, 1, 0, 0, 1, 2, 3, 0, 1, 3, 2,
  0, 2, 1, 3, 0, 3, 1, 2, 0, 2, 3, 1, 0, 3, 2, 1, 1, 0, 2, 3, 1, 0, 3, 2,
]
const w16 = (d: Uint8Array, o: number, v: number) => ((d[o] = v & 0xff), (d[o + 1] = (v >>> 8) & 0xff))
const w32 = (d: Uint8Array, o: number, v: number) => (w16(d, o, v & 0xffff), w16(d, o + 2, v >>> 16))
const r16 = (d: Uint8Array, o: number) => d[o] | (d[o + 1] << 8)

function crypt(d: Uint8Array, start: number, end: number, seed: number) {
  for (let i = start; i < end; i += 2) {
    seed = (Math.imul(0x41c64e6d, seed) + 0x6073) >>> 0
    const x = seed >>> 16
    d[i] ^= x & 0xff
    d[i + 1] ^= x >>> 8
  }
}

const encodeName = (s: string) => [...s].map((c) => gen4.chars.indexOf(c) + gen4.charStart)

interface MonSpec { pid: number; species: number; exp: number; level?: number; nickname?: string; met: number; ability: number; gender: number; egg?: boolean; hp?: number }

function makeMon({ pid, species, exp, level, nickname, met, ability, gender, egg, hp = 20 }: MonSpec, party: boolean, tid: number, sid: number): Uint8Array {
  const d = new Uint8Array(party ? 236 : 136)
  w32(d, 0, pid)
  w16(d, 0x08, species)
  w16(d, 0x0c, tid)
  w16(d, 0x0e, sid)
  w32(d, 0x10, exp)
  d[0x15] = ability
  w32(d, 0x38, (egg ? 1 << 30 : 0) | (nickname ? 0x80000000 : 0) | 0x1234)
  d[0x40] = gender << 1
  w16(d, 0x46, met)
  const name = nickname ? encodeName(nickname) : []
  name.forEach((v, i) => w16(d, 0x48 + i * 2, v))
  w16(d, 0x48 + name.length * 2, 0xffff)
  if (party) {
    d[0x8c] = level ?? 0
    w16(d, 0x8e, hp)
  }
  let sum = 0
  for (let i = 8; i < 136; i += 2) sum = (sum + r16(d, i)) & 0xffff
  w16(d, 6, sum)
  // Encrypt: shuffle with the inverse table, then xor.
  const sv = INVERT[(pid >>> 13) & 31]
  const blocks = [0, 1, 2, 3].map((b) => d.slice(8 + b * 32, 8 + (b + 1) * 32))
  for (let i = 0; i < 4; i++) d.set(blocks[POS[sv * 4 + i]], 8 + i * 32)
  crypt(d, 8, 136, sum)
  if (party) crypt(d, 136, 236, pid)
  return d
}

const TID = 12345
const SID = 54321
const save = new Uint8Array(0x80000)
const GENERAL = 0xf628
const STORAGE_START = 0xf700
const STORAGE = 0x12310

function writeBlocks(base: number, counter: number, party: MonSpec[], box: MonSpec[], trainer: string) {
  const g = base
  encodeName(trainer).forEach((v, i) => w16(save, g + 0x64 + i * 2, v))
  w16(save, g + 0x64 + trainer.length * 2, 0xffff)
  w16(save, g + 0x64 + 0x10, TID)
  w16(save, g + 0x64 + 0x12, SID)
  save[g + 0x64 + 0x1a] = 0b00000011 // Falkner, Bugsy
  save[g + 0x94] = party.length
  party.forEach((m, i) => save.set(makeMon(m, true, TID, SID), g + 0x98 + i * 236))
  w32(save, g + GENERAL - 0x14, counter)
  w32(save, g + GENERAL - 0xc, GENERAL)
  const s = base + STORAGE_START
  box.forEach((m, i) => save.set(makeMon(m, false, TID, SID), s + Math.floor(i / 30) * 0x1000 + (i % 30) * 136))
  w32(save, s + STORAGE - 0x14, counter)
}

// Stale copy in partition 1, current one (higher counter) in partition 2.
writeBlocks(0, 5, [{ pid: 1, species: 1, exp: 0, level: 5, met: 126, ability: 65, gender: 0 }], [], 'OLD')
writeBlocks(
  0x40000,
  6,
  [
    { pid: 0xdeadbeef, species: 155, exp: 2000, level: 14, nickname: 'Blaze', met: 126, ability: 66, gender: 0 },
    { pid: 0x0badf00d, species: 16, exp: 300, level: 7, met: 177, ability: 51, gender: 1, hp: 0 },
    { pid: 0x12345678, species: 175, exp: 0, level: 1, met: 2000, ability: 55, gender: 1, egg: true },
  ],
  [
    // Geodude (medium-slow): Lv 12 needs 973 EXP, so 1,000 EXP is Lv 12 and 972 is Lv 11.
    { pid: 0x0c0ffee0, species: 74, exp: 1000, met: 152, ability: 69, gender: 0 },
    { pid: (TID ^ SID ^ 0x5) << 16 | 0x5, species: 129, exp: 100, met: 177, ability: 33, gender: 0 }, // shiny Magikarp
  ],
  'Ethan',
)

const parsed = parseHgssSave(save.buffer)
assert.equal(parsed.trainer, 'Ethan')
assert.deepEqual(parsed.badges, ['Falkner', 'Bugsy'])
assert.equal(parsed.party.length, 2, 'egg is skipped')
const [cynda, pidgey] = parsed.party
assert.equal(cynda.speciesId, 155)
assert.equal(cynda.nickname, 'Blaze')
assert.equal(cynda.level, 14)
assert.equal(cynda.metLocation, 'New Bark Town')
assert.equal(cynda.ability, 'blaze')
assert.equal(cynda.nature, ['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax', 'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive', 'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash', 'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'][0xdeadbeef % 25])
assert.equal(cynda.gender, 'm')
assert.equal(pidgey.nickname, undefined)
assert.equal(pidgey.gender, 'f')
assert.equal(pidgey.fainted, true)
assert.equal(parsed.boxes.length, 2)
assert.equal(parsed.boxes[0].level, 12)
assert.equal(parsed.boxes[0].inParty, false)
assert.equal(parsed.boxes[1].shiny, true)
assert.equal(parsed.boxes[0].shiny, false)
console.log('hgss save reader: all assertions passed', parsed.party.map((m) => m.metLocation), parsed.boxes.map((m) => [m.metLocation, m.level]))

// Optionally write the synthetic save for UI testing: SAVE_OUT=/path/test.sav npx tsx …
if (process.env.SAVE_OUT) {
  const { writeFileSync } = await import('node:fs')
  writeFileSync(process.env.SAVE_OUT, save)
}
