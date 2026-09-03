import { useState, type FormEvent } from 'react'
import { authRepo } from '../db/repository'
import { LogoMark } from './icons'

export default function SignupScreen({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (username.trim().length < 2) {
      setError('שם משתמש קצר מדי')
      return
    }
    if (password.length < 4) {
      setError('הסיסמה חייבת להכיל לפחות 4 תווים')
      return
    }
    if (password !== confirm) {
      setError('הסיסמאות לא תואמות')
      return
    }
    setSubmitting(true)
    await authRepo.setCredentials(username.trim(), password)
    onDone()
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-bg px-6">
      <div className="flex flex-col items-center gap-2">
        <LogoMark size={56} />
        <h1 className="text-xl font-bold text-text">Lock In</h1>
        <p className="text-sm text-text-dim">צור חשבון מקומי כדי להתחיל</p>
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
          autoComplete="new-password"
          name="new-password"
          placeholder="סיסמה"
          className="rounded-lg border border-border bg-surface-hi px-3 py-2.5 text-text"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          name="confirm-password"
          placeholder="אימות סיסמה"
          className="rounded-lg border border-border bg-surface-hi px-3 py-2.5 text-text"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-ink disabled:opacity-50"
        >
          הרשמה
        </button>
      </form>
      <p className="max-w-sm text-center text-xs text-text-dim">
        זו נעילת מכשיר מקומית — הנתונים שלך תמיד נשארים רק בדפדפן הזה, אין שרת ואין שחזור מרחוק.
      </p>
    </div>
  )
}
