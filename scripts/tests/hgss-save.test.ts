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

function crc16(d: Uint8Array, start: number, end: number) {
  let top = 0xff
  let bot = 0xff
  for (let i = start; i < end; i++) {
    let x = d[i] ^ top
    x ^= x >> 4
    top = (bot ^ (x >> 3) ^ (x << 4)) & 0xff
    bot = (x ^ (x << 5)) & 0xff
  }
  return (top << 8) | bot
}

const TID = 12345
const SID = 54321
let save = new Uint8Array(0x80000)
const GENERAL = 0xf628
const STORAGE_START = 0xf700
const STORAGE = 0x12310

function writeBlocks(base: number, counter: number, party: MonSpec[], box: MonSpec[], trainer: string, tid = TID, sid = SID) {
  const g = base
  encodeName(trainer).forEach((v, i) => w16(save, g + 0x64 + i * 2, v))
  w16(save, g + 0x64 + trainer.length * 2, 0xffff)
  w16(save, g + 0x64 + 0x10, tid)
  w16(save, g + 0x64 + 0x12, sid)
  save[g + 0x64 + 0x1a] = 0b00000011 // Falkner, Bugsy
  save[g + 0x94] = party.length
  party.forEach((m, i) => save.set(makeMon(m, true, tid, sid), g + 0x98 + i * 236))
  w32(save, g + GENERAL - 0x14, counter)
  w32(save, g + GENERAL - 0xc, GENERAL)
  w16(save, g + GENERAL - 2, crc16(save, g, g + GENERAL - 0x10))
  const s = base + STORAGE_START
  box.forEach((m, i) => save.set(makeMon(m, false, tid, sid), s + Math.floor(i / 30) * 0x1000 + (i % 30) * 136))
  w32(save, s + STORAGE - 0x14, counter)
  w16(save, s + STORAGE - 2, crc16(save, s, s + STORAGE - 0x10))
}

// The real-world trap: an OLD game (different trainer) left in partition 1 with a HIGHER save
// counter than the current game, because starting a New Game restarts the counter.
writeBlocks(0, 500, [{ pid: 1, species: 1, exp: 0, level: 5, met: 126, ability: 65, gender: 0 }], [{ pid: 2, species: 4, exp: 0, met: 177, ability: 66, gender: 0 }], 'OLD', 111, 222)
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

const games = parseHgssSave(save.buffer)
assert.equal(games.length, 2, 'both games are offered')
assert.deepEqual(games.map((g) => g.trainer).sort(), ['Ethan', 'OLD'])
const old = games.find((g) => g.trainer === 'OLD')!
assert.deepEqual(old.boxes.map((m) => m.speciesId), [4], "old game keeps its own PC")
const parsed = games.find((g) => g.trainer === 'Ethan')!
assert.equal(parsed.tid, TID)
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
// Two copies of the same game collapse into one (the newer); a corrupt copy is ignored.
const current = save.slice()
save = new Uint8Array(0x80000)
writeBlocks(0, 7, [{ pid: 9, species: 152, exp: 0, level: 9, met: 126, ability: 65, gender: 0 }], [], 'Ethan')
writeBlocks(0x40000, 6, [{ pid: 9, species: 152, exp: 0, level: 5, met: 126, ability: 65, gender: 0 }], [], 'Ethan')
let same = parseHgssSave(save.buffer)
assert.equal(same.length, 1)
assert.equal(same[0].party[0].level, 9, 'newer copy wins')
save[100] ^= 0xff // corrupt the newer copy
same = parseHgssSave(save.buffer)
assert.equal(same.length, 1)
assert.equal(same[0].party[0].level, 5, 'corrupt copy is skipped')
save = current

console.log('hgss save reader: all assertions passed', parsed.party.map((m) => m.metLocation), parsed.boxes.map((m) => [m.metLocation, m.level]))

// Optionally write the synthetic save for UI testing: SAVE_OUT=/path/test.sav npx tsx …
if (process.env.SAVE_OUT) {
  const { writeFileSync } = await import('node:fs')
  writeFileSync(process.env.SAVE_OUT, save)
}

// Cleaning up after a sync that read the old game: entries linked to the other game's PIDs are
// re-matched when this game has the same family, and offered for removal otherwise.
{
  const { planSync } = await import('../../src/lib/saves/sync')
  const ethan = games.find((g) => g.trainer === 'Ethan')!
  const oldGame = games.find((g) => g.trainer === 'OLD')!
  const run = { id: 1, defeatedBosses: [] } as never
  const enc = (id: number, location: string, speciesId: number, pid: number) =>
    ({ id, runId: 1, location, speciesId, pid, status: 'party', order: 0, createdAt: id }) as never
  const plan = planSync(
    ethan,
    run,
    [enc(1, 'New Bark Town', 155, 1), enc(2, 'Route 29', 4, 2)], // linked to OLD's Bulbasaur / Charmander PIDs
    ['New Bark Town', 'Route 29', 'Route 4'],
    [],
    [oldGame],
  )
  assert.deepEqual(plan.wrongGame.map((e: { id: number }) => e.id), [2], 'Charmander only exists in the old game')
  assert.ok(plan.updates.some((u) => u.encounter.id === 1 && u.mon.pid === 0xdeadbeef), 'Cyndaquil re-links to this game')
  console.log('old-game cleanup: ok')
}

// New Game leftover in the PC only: both general copies are the new game, but one PC copy still
// holds the previous game's boxes with a higher counter. Those must not be read as this game's.
{
  const backup = save
  save = new Uint8Array(0x80000)
  writeBlocks(0, 500, [], [{ pid: 77, species: 4, exp: 0, met: 177, ability: 66, gender: 0 }], 'OLD', 111, 222) // old game everywhere…
  writeBlocks(0, 7, [{ pid: 9, species: 155, exp: 0, level: 9, met: 126, ability: 66, gender: 0 }], [], 'Ethan') // …then the new game's general on top
  const g0 = save.slice(0, 0xf628)
  writeBlocks(0x40000, 6, [{ pid: 9, species: 155, exp: 0, level: 5, met: 126, ability: 66, gender: 0 }], [], 'Ethan')
  // partition 1's storage is still OLD's (counter 500); restore partition 1's general to Ethan's
  save.set(g0, 0)
  const found = parseHgssSave(save.buffer)
  assert.equal(found.length, 1)
  assert.equal(found[0].trainer, 'Ethan')
  assert.deepEqual(found[0].boxes, [], "the old game's PC is not this game's")
  assert.deepEqual(found[0].foreignPids, [77])
  console.log('leftover PC copy: ok')
  save = backup
}

// The wrong file was synced before (another trainer): everything linked to it is offered for removal.
{
  const { planSync } = await import('../../src/lib/saves/sync')
  const ethan = games.find((g) => g.trainer === 'Ethan')!
  const run = { id: 1, defeatedBosses: [], saveTrainer: { tid: 17730, sid: 30662 } } as never
  const enc = (id: number, location: string, speciesId: number, pid?: number) =>
    ({ id, runId: 1, location, speciesId, pid, status: 'box', order: 0, createdAt: id }) as never
  const plan = planSync(ethan, run, [enc(1, 'Bell Tower', 250, 4242), enc(2, 'New Bark Town', 155)], ['New Bark Town', 'Route 29', 'Route 4'], [])
  assert.deepEqual(plan.wrongGame.map((e: { id: number }) => e.id), [1], 'Ho-Oh from the previous trainer')
  assert.equal(plan.missing.length, 0)
  console.log('trainer change cleanup: ok')
}
