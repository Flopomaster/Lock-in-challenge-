export interface IconProps {
  className?: string
  size?: number
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Svg({ className, size = 24, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...stroke}>
      {children}
    </svg>
  )
}

export function IconHome(p: IconProps) {
  return <Svg {...p}><path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" /></Svg>
}

export function IconMap(p: IconProps) {
  return <Svg {...p}><path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z" />
    <path d="M9 4v13M15 6.5v13" /></Svg>
}

export function IconTeam(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h5.5M15 12h5.5" />
    <circle cx="12" cy="12" r="3" /></Svg>
}

export function IconGrave(p: IconProps) {
  return <Svg {...p}><path d="M6 21V10a6 6 0 0 1 12 0v11" />
    <path d="M4 21h16" />
    <path d="M12 9v6M9.5 11.5h5" /></Svg>
}

export function IconSettings(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></Svg>
}

export function IconPlus(p: IconProps) {
  return <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
}

export function IconClose(p: IconProps) {
  return <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
}

export function IconSearch(p: IconProps) {
  return <Svg {...p}><circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" /></Svg>
}

export function IconSwap(p: IconProps) {
  return <Svg {...p}><path d="M7 4 3 8l4 4" />
    <path d="M3 8h13" />
    <path d="m17 20 4-4-4-4" />
    <path d="M21 16H8" /></Svg>
}

export function IconChevron(p: IconProps) {
  return <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
}

export function IconWarn(p: IconProps) {
  return <Svg {...p}><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" /></Svg>
}

export function IconTrophy(p: IconProps) {
  return <Svg {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" /></Svg>
}

export function IconSkull(p: IconProps) {
  return <Svg {...p}><path d="M12 3a8 8 0 0 0-5 14.2V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.8A8 8 0 0 0 12 3Z" />
    <circle cx="9" cy="11.5" r="1.6" />
    <circle cx="15" cy="11.5" r="1.6" />
    <path d="M10 21v-2.5M14 21v-2.5" /></Svg>
}

export function IconSparkle(p: IconProps) {
  return <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></Svg>
}

export function IconBadge(p: IconProps) {
  return <Svg {...p}><path d="M12 3 4 7v5c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V7l-8-4Z" />
    <path d="m9 12 2 2 4-4" /></Svg>
}

export function Pokeball({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="14" fill="var(--surface)" stroke="currentColor" strokeWidth="2.5" />
      <path d="M2 16a14 14 0 0 1 28 0Z" fill="var(--primary)" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="4.5" fill="var(--surface)" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  )
}
