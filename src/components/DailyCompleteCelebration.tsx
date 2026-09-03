import { useEffect } from 'react'
import { ConfettiBurst } from './ConfettiBurst'

export function DailyCompleteCelebration({
  show,
  onDismiss,
}: {
  show: boolean
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!show) return
    const t = setTimeout(onDismiss, 2800)
    return () => clearTimeout(t)
  }, [show, onDismiss])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onDismiss}
    >
      <div className="celebration-pop-in relative mx-8 rounded-3xl border border-primary-border bg-surface px-10 py-8 text-center">
        <ConfettiBurst burstKey={1} count={48} />
        <div className="text-5xl">🔒</div>
        <div className="mt-3 text-xl font-bold text-text">ננעלת היום!</div>
        <div className="mt-1 text-sm text-text-dim">כל היעדים היומיים הושלמו</div>
      </div>
    </div>
  )
}
