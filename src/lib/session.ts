const SESSION_KEY = 'lockin_unlocked'

export function isUnlocked(): boolean {
  return localStorage.getItem(SESSION_KEY) === '1'
}

export function unlock(): void {
  localStorage.setItem(SESSION_KEY, '1')
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
  window.location.reload()
}
