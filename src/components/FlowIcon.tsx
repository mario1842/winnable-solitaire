/** Drop mark matching the Flow of the Elements favicon. */
export function FlowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="#110e0b" />
      <path
        d="M16 5c4.2 5.2 6.2 8.2 6.2 12.2a6.2 6.2 0 1 1-12.4 0C9.8 13.2 11.8 10.2 16 5z"
        fill="#49c6f2"
      />
    </svg>
  )
}
