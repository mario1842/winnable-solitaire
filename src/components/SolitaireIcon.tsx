/** Playing-card mark matching this game's favicon. */
export function SolitaireIcon({ className }: { className?: string }) {
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
        x="14"
        y="10"
        width="36"
        height="44"
        rx="5"
        fill="#f3ebe0"
        stroke="#5c4030"
        strokeWidth="2"
      />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontSize="26"
        fontFamily="Georgia, 'Cormorant Garamond', serif"
        fill="#a83028"
      >
        A
      </text>
      <text
        x="32"
        y="52"
        textAnchor="middle"
        fontSize="12"
        fontFamily="Georgia, 'Cormorant Garamond', serif"
        fill="#a83028"
      >
        ♥
      </text>
    </svg>
  )
}
