export default function Gravestone({ name, className = '', small }: { name: string; className?: string; small?: boolean }) {
  const w = small ? 72 : 120
  return (
    <svg width={w} height={w * 1.1} viewBox="0 0 120 132" className={className} direction="ltr" aria-hidden>
      <g className="candle-flame">
        <ellipse cx="18" cy="96" rx="4" ry="8" fill="#ffcb05" />
        <ellipse cx="18" cy="98" rx="2" ry="4" fill="#fff6c8" />
      </g>
      <rect x="15" y="104" width="6" height="16" rx="1" fill="#e9e4d4" />
      <path d="M30 128V48a30 30 0 0 1 60 0v80Z" fill="#7d8496" stroke="#5c6272" strokeWidth="3" />
      <text x="60" y="62" textAnchor="middle" fontSize="15" fontWeight="700" fill="#2b2f3a" fontFamily="serif">
        R.I.P.
      </text>
      <text x="60" y="84" textAnchor="middle" fontSize={name.length > 9 ? 9 : 12} fontWeight="600" fill="#2b2f3a">
        {name}
      </text>
      <rect x="8" y="124" width="104" height="8" rx="3" fill="#4a5a3a" />
    </svg>
  )
}
