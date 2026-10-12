import { db } from '../db/db'
import type { Encounter, EncounterStatus, PartnerMon, Run } from '../db/types'

// A share code is our side of a Soul Link run: game + one entry per encounter,
// deflated and base64url-encoded so it fits in a WhatsApp message or a link.
const PREFIX = 'NZ1.'
const STATUS_CODES: Record<EncounterStatus, string> = { party: 'p', box: 'b', dead: 'd', missed: 'm' }
const CODE_STATUS = Object.fromEntries(Object.entries(STATUS_CODES).map(([k, v]) => [v, k])) as Record<string, EncounterStatus>

type Entry = [location: string, speciesId: number, status: string, nickname?: string, level?: number]

interface Payload {
  g: string
  n?: string
  e: Entry[]
}

const toBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0))
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

export async function encodeShareCode(run: Run, encounters: Encounter[], playerName?: string): Promise<string> {
  const payload: Payload = {
    g: run.gameId,
    n: playerName || undefined,
    e: encounters.map((e) => {
      const entry: Entry = [e.location, e.speciesId ?? 0, STATUS_CODES[e.status]]
      if (e.nickname || e.level) entry.push(e.nickname ?? '')
      if (e.level) entry.push(e.level)
      return entry
    }),
  }
  const json = new TextEncoder().encode(JSON.stringify(payload))
  return PREFIX + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))
}

export interface DecodedCode {
  gameId: string
  name?: string
  mons: Record<string, PartnerMon>
}

/** Accepts a bare code or a full share link containing one. Throws if invalid. */
export async function decodeShareCode(input: string): Promise<DecodedCode> {
  const match = input.match(/NZ1\.[A-Za-z0-9_-]+/)
  if (!match) throw new Error('no code')
  const bytes = await pipe(fromBase64Url(match[0].slice(PREFIX.length)), new DecompressionStream('deflate-raw'))
  const payload = JSON.parse(new TextDecoder().decode(bytes)) as Payload
  if (typeof payload.g !== 'string' || !Array.isArray(payload.e)) throw new Error('bad payload')
  const mons: Record<string, PartnerMon> = {}
  for (const [location, speciesId, status, nickname, level] of payload.e) {
    mons[location] = {
      speciesId: speciesId || undefined,
      status: CODE_STATUS[status] ?? 'missed',
      nickname: nickname || undefined,
      level: level || undefined,
    }
  }
  return { gameId: payload.g, name: payload.n, mons }
}

export function shareLink(code: string): string {
  return `${location.origin}${location.pathname}#/soul-link?code=${code}`
}

export async function importPartner(run: Run, decoded: DecodedCode) {
  await db.runs.update(run.id!, {
    partner: { importedAt: Date.now(), mons: decoded.mons },
    partnerName: run.partnerName || decoded.name,
  })
}

export const isAlive = (status: EncounterStatus | undefined) => status === 'party' || status === 'box'
