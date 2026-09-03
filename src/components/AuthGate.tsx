import { useEffect, useState, type ReactNode } from 'react'
import { authRepo } from '../db/repository'
import { isUnlocked, unlock } from '../lib/session'
import LoginScreen from './LoginScreen'
import SignupScreen from './SignupScreen'

type Status = 'loading' | 'signup' | 'login' | 'unlocked'

export default function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    authRepo.exists().then((exists) => {
      if (!exists) {
        setStatus('signup')
      } else if (isUnlocked()) {
        setStatus('unlocked')
      } else {
        setStatus('login')
      }
    })
  }, [])

  function handleUnlocked() {
    unlock()
    setStatus('unlocked')
  }

  if (status === 'loading') return null
  if (status === 'signup') return <SignupScreen onDone={handleUnlocked} />
  if (status === 'login') {
    return <LoginScreen onSuccess={handleUnlocked} onReset={() => setStatus('signup')} />
  }
  return <>{children}</>
}
