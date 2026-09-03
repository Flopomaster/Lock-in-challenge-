import type { PropsWithChildren, ReactNode } from 'react'

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">{title}</h2>
      {action}
    </div>
  )
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hi">
      <div
        className="h-full rounded-full bg-gradient-to-l from-primary to-secondary transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
