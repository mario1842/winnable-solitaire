interface ContrastToggleProps {
  enabled: boolean
  onToggle: () => void
  compact?: boolean
}

export function ContrastToggle({ enabled, onToggle, compact }: ContrastToggleProps) {
  return (
    <button
      type="button"
      className={`contrast-toggle${enabled ? ' on' : ''}${compact ? ' compact' : ''}`}
      onClick={onToggle}
      aria-pressed={enabled}
      title={enabled ? 'High contrast on (Balatro-style suits)' : 'High contrast off'}
    >
      <span className="contrast-swatches" aria-hidden="true">
        <span className="swatch heart" />
        <span className="swatch diamond" />
        <span className="swatch club" />
        <span className="swatch spade" />
      </span>
      {!compact ? (
        <span className="contrast-label">
          High contrast
        </span>
      ) : null}
    </button>
  )
}
