/** Mine mark matching the Winnable Minesweeper favicon. */
export function MineIcon({ className }: { className?: string }) {
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
      <rect width="64" height="64" rx="14" fill="#2a2118" />
      <rect
        x="7"
        y="7"
        width="50"
        height="50"
        rx="10"
        fill="#f3ebe0"
        stroke="#5c4030"
        strokeWidth="2"
      />
      <g stroke="#1c1410" strokeWidth="3.4" strokeLinecap="round">
        <path d="M32 14.5v7.2M32 42.3v7.2M14.5 32h7.2M42.3 32h7.2" />
        <path d="M19.6 19.6l5.1 5.1M39.3 39.3l5.1 5.1M44.4 19.6l-5.1 5.1M24.7 39.3l-5.1 5.1" />
      </g>
      <circle cx="32" cy="32" r="8.2" fill="#1c1410" />
      <circle cx="29.2" cy="28.8" r="2.15" fill="#f3ebe0" />
    </svg>
  )
}
