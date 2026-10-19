/** Compact mahjong-tile mark matching the sister game favicon. */
export function MahjongIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="12" fill="#2a2118" />
      <rect
        x="12"
        y="10"
        width="40"
        height="44"
        rx="6"
        fill="#f3ebe0"
        stroke="#5c4030"
        strokeWidth="2"
      />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontSize="28"
        fontFamily="Georgia, 'Cormorant Garamond', serif"
        fill="#3d7a6a"
      >
        中
      </text>
    </svg>
  )
}
