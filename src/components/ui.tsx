import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { TYPE_COLORS } from '../data/types'
import { IconWarn } from './icons'

type Tone = 'primary' | 'ghost' | 'danger' | 'soft'

const TONES: Record<Tone, string> = {
  primary: 'bg-primary text-primary-ink shadow-sm active:brightness-95',
  soft: 'bg-surface-hi text-text active:brightness-95',
  ghost: 'text-text-dim hover:bg-surface-hi',
  danger: 'bg-danger-bg text-danger active:brightness-95',
}

export function Button({ tone = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 font-semibold transition disabled:opacity-40 ${TONES[tone]} ${className}`}
      {...props}
    />
  )
}

export function TypeBadge({ type, small }: { type: string; small?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full font-semibold uppercase tracking-wide text-white ${small ? 'px-1.5 py-px text-[9px]' : 'px-2 py-0.5 text-[10px]'}`}
      style={{ background: TYPE_COLORS[type] ?? '#888', textShadow: '0 1px 1px rgba(0,0,0,.25)' }}
    >
      {type}
    </span>
  )
}

export function Warning({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-xl bg-warn-bg px-3 py-2.5 text-sm text-warn">
      <IconWarn size={18} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-dim">{children}</div>
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface-hi p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
            value === o.value ? 'bg-surface text-text shadow-sm' : 'text-text-dim'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; desc?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-2">
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        {desc && <div className="text-xs text-text-dim">{desc}</div>}
      </div>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-primary' : 'bg-border'}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'start-5.5' : 'start-0.5'}`}
        />
      </span>
    </label>
  )
}
