export interface IconProps {
  className?: string
  size?: number
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconLogout({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M16 8l4 4-4 4" />
      <path d="M20 12H9" />
    </svg>
  )
}

export function IconHome({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
      <path d="M9.5 20v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20" />
    </svg>
  )
}

export function IconDumbbell({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M2.5 9v6" />
      <path d="M4.5 7.5v9" />
      <path d="M7.5 9.5v5" />
      <path d="M16.5 9.5v5" />
      <path d="M19.5 7.5v9" />
      <path d="M21.5 9v6" />
      <line x1="7.5" y1="12" x2="16.5" y2="12" />
    </svg>
  )
}

export function IconBowl({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M3 11a9 9 0 0 0 18 0" />
      <line x1="3" y1="11" x2="21" y2="11" />
      <line x1="12" y1="17" x2="12" y2="19.5" />
      <line x1="8.5" y1="19.5" x2="15.5" y2="19.5" />
      <path d="M9 4.5c0 1.2-1.2 1.2-1.2 2.5" />
      <path d="M13.5 3.5c0 1.2-1.2 1.2-1.2 2.5" />
    </svg>
  )
}

export function IconTarget({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconFlame({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.8 2.2c.7 2.7-.9 4.1-2.1 5.7-1.4 1.8-2.4 3.5-2.4 5.8a4.7 4.7 0 0 0 9.4 0c0-1.8-.7-3-1.3-4 .2 1.7-.5 2.7-1.2 3.1-.4-1.6.4-2.8.2-4.5-.2-1.7-1.4-3.3-2.6-6.1Z" />
      <path
        d="M11.8 12.5c-.6.9-1 1.6-1 2.5a1.9 1.9 0 0 0 3.8 0c0-.5-.1-.9-.3-1.3-.3.6-.8.9-1.2.8.1-.7-.3-1.2-1.3-2Z"
        opacity="0.45"
      />
    </svg>
  )
}

export function IconCheck({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M4 12.5l5 5L20 6" />
    </svg>
  )
}

export function IconPlus({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconMinus({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconBarcode({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M3 4v16" />
      <path d="M7 4v16" />
      <path d="M10.5 4v16" />
      <path d="M13 4v16" />
      <path d="M17 4v16" />
      <path d="M21 4v16" />
    </svg>
  )
}

export function IconCamera({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  )
}

export function IconEdit({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M4 20l.9-3.9L15.6 4.4a1.5 1.5 0 0 1 2.1 0l1.9 1.9a1.5 1.5 0 0 1 0 2.1L9 19.1 4 20Z" />
      <path d="M14 6.5l3.5 3.5" />
    </svg>
  )
}

export function IconTrash({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

export function IconDroplet({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3c3 4 6 7.6 6 11.2a6 6 0 0 1-12 0C6 10.6 9 7 12 3Z" />
    </svg>
  )
}

export function IconBook({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22v-16.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 1 2.5 2v-16.5Z" />
    </svg>
  )
}

export function IconMoon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20 14.8A8.5 8.5 0 1 1 9.2 4a7 7 0 0 0 10.8 10.8Z" />
    </svg>
  )
}

export function IconBolt({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  )
}

export function IconScale({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <rect x="4" y="16" width="16" height="4.5" rx="1.2" />
      <path d="M12 16V6" />
      <path d="M7 6h10" />
      <path d="M7 6 4.5 11.5a2.6 2.6 0 0 0 5 0Z" />
      <path d="M17 6l-2.5 5.5a2.6 2.6 0 0 0 5 0Z" />
    </svg>
  )
}

export function IconChevronDown({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M5.5 9l6.5 6.5L18.5 9" />
    </svg>
  )
}

export function LogoMark({ className, size = 40 }: IconProps) {
  const gradId = 'logo-grad'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-secondary)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill={`url(#${gradId})`} />
      <rect
        x="12.5"
        y="18"
        width="15"
        height="13"
        rx="3"
        fill="none"
        stroke="var(--color-primary-ink)"
        strokeWidth="2"
      />
      <path
        d="M15.5 18v-4a4.5 4.5 0 0 1 9 0v4"
        fill="none"
        stroke="var(--color-primary-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="24" r="1.6" fill="var(--color-primary-ink)" />
      <line
        x1="20"
        y1="25.4"
        x2="20"
        y2="27.2"
        stroke="var(--color-primary-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
