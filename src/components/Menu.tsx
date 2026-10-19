import type { DrawMode } from '../engine/cards'
import { ContrastToggle } from './ContrastToggle'
import { SisterGames } from './SisterGames'

interface MenuProps {
  onStart: (drawMode: DrawMode) => void
  highContrast: boolean
  onToggleContrast: () => void
}

export function Menu({ onStart, highContrast, onToggleContrast }: MenuProps) {
  return (
    <div className="menu">
      <div className="brand">
        <h1>
          Winnable
          <span>Solitaire</span>
        </h1>
        <p>
          Classic Klondike where every deal is generated to be solvable — drag
          cards to move them, click the stock to draw.
        </p>
        <div className="guarantee" aria-hidden="true">
          Guaranteed winnable deals
        </div>
      </div>

      <div className="mode-grid">
        <button type="button" className="mode-card" onClick={() => onStart(1)}>
          <h2>Draw One</h2>
          <p>Turn one card at a time from the stock. Deeper strategy, clearer path.</p>
          <span className="meta">Classic · unlimited passes</span>
        </button>
        <button type="button" className="mode-card" onClick={() => onStart(3)}>
          <h2>Draw Three</h2>
          <p>Turn three cards at a time. Tighter stock timing, still always winnable.</p>
          <span className="meta">Vegas-style · unlimited passes</span>
        </button>
      </div>

      <ContrastToggle enabled={highContrast} onToggle={onToggleContrast} />

      <SisterGames variant="menu" />
    </div>
  )
}
