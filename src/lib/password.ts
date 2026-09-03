// This is a local device lock, not a real account system — there is no server
// to send a password to. Everything below just keeps the stored value from
// being a plain-text password sitting in IndexedDB; it is not a substitute
// for real authentication if this app ever grows a backend.
const ITERATIONS = 150_000

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function randomSaltHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return bufToHex(bytes.buffer)
}

async function derive(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder()
  const saltBytes = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return bufToHex(bits)
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomSaltHex()
  const hash = await derive(password, salt)
  return { hash, salt }
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  const attempt = await derive(password, salt)
  return attempt === hash
}
