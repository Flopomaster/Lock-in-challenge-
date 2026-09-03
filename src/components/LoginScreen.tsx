import { useState, type FormEvent } from 'react'
import { authRepo } from '../db/repository'
import { LogoMark } from './icons'

export default function LoginScreen({
  onSuccess,
  onReset,
}: {
  onSuccess: () => void
  onReset: () => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setChecking(true)
    const ok = await authRepo.verify(username.trim(), password)
    setChecking(false)
    if (ok) {
      onSuccess()
    } else {
      setError('שם משתמש או סיסמה שגויים')
    }
  }

  async function handleForgot() {
    const sure = window.confirm(
      'איפוס הסיסמה ימחק רק את הנעילה המקומית — כל הנתונים שלך (אימונים, תזונה, יעדים) יישארו בדיוק כמו שהם. תצטרך להירשם מחדש. להמשיך?',
    )
    if (!sure) return
    await authRepo.clear()
    onReset()
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-bg px-6">
      <div className="flex flex-col items-center gap-2">
        <LogoMark size={56} />
        <h1 className="text-xl font-bold text-text">Lock In</h1>
        <p className="text-sm text-text-dim">התחבר כדי להמשיך</p>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          name="username"
          placeholder="שם משתמש"
          className="rounded-lg border border-border bg-surface-hi px-3 py-2.5 text-text"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          name="password"
          placeholder="סיסמה"
          className="rounded-lg border border-border bg-surface-hi px-3 py-2.5 text-text"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={checking}
          className="rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-ink disabled:opacity-50"
        >
          התחברות
        </button>
      </form>
      <button type="button" onClick={handleForgot} className="text-xs text-text-dim underline">
        שכחתי סיסמה
      </button>
    </div>
  )
}
