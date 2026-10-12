import { Link } from 'react-router-dom'
import { useT } from '../lib/settings'
import { IconPlus, Pokeball } from './icons'

export default function Welcome() {
  const t = useT()
  return (
    <div className="animate-rise-in flex h-full flex-col items-center justify-center px-6 text-center">
      <Pokeball size={88} className="text-text" />
      <h2 className="mt-6 text-2xl font-bold">{t('welcomeTitle')}</h2>
      <p className="mt-2 max-w-xs text-text-dim">{t('welcomeBody')}</p>
      <Link to="/runs/new" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-ink shadow">
        <IconPlus size={20} />
        {t('newRun')}
      </Link>
    </div>
  )
}
