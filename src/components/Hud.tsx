import { formatTime, remaining, type GameState } from '../engine/game'
import { ContrastToggle } from './ContrastToggle'
import { SisterGames } from './SisterGames'

interface HudProps {
  state: GameState
  highContrast: boolean
  onToggleContrast: () => void
  onUndo: () => void
  onHint: () => void
  onNewGame: () => void
  onChangeMode: () => void
}

export function Hud({
  state,
  highContrast,
  onToggleContrast,
  onUndo,
  onHint,
  onNewGame,
  onChangeMode,
}: HudProps) {
  return (
    <header className="hud">
      <div className="hud-stats">
        <div className="stat">
          <label>Mode</label>
          <strong>Draw {state.drawMode}</strong>
        </div>
        <div className="stat">
          <label>Time</label>
          <strong>{formatTime(state.elapsedMs)}</strong>
        </div>
        <div className="stat">
          <label>Score</label>
          <strong>{state.score}</strong>
        </div>
        <div className="stat">
          <label>Moves</label>
          <strong>{state.moves}</strong>
        </div>
        <div className="stat">
          <label>Left</label>
          <strong>{remaining(state)}</strong>
        </div>
      </div>

      <SisterGames variant="hud" />

      <div className="hud-actions">
        <ContrastToggle enabled={highContrast} onToggle={onToggleContrast} compact />
        <button
          type="button"
          className="btn"
          onClick={onUndo}
          disabled={state.history.length === 0}
        >
          Undo
        </button>
        <button
          type="button"
          className="btn"
          onClick={onHint}
          disabled={state.status !== 'playing'}
          title="Shortcut: H"
        >
          Hint <kbd className="key">H</kbd>
        </button>
        <button type="button" className="btn" onClick={onNewGame}>
          New deal
        </button>
        <button type="button" className="btn btn-ghost" onClick={onChangeMode}>
          Modes
        </button>
      </div>
    </header>
  )
}
