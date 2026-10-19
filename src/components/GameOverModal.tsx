import { createPortal } from 'react-dom'
import { formatTime, type GameState } from '../engine/game'

interface GameOverModalProps {
  state: GameState
  onNewGame: () => void
  onChangeMode: () => void
}

export function GameOverModal({ state, onNewGame, onChangeMode }: GameOverModalProps) {
  if (state.status !== 'won') return null

  return createPortal(
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="win-title">
      <div className="modal">
        <h2 id="win-title">You won!</h2>
        <p>Cleared a guaranteed-winnable deal. Ready for another?</p>
        <div className="modal-stats">
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
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onNewGame}>
            New deal
          </button>
          <button type="button" className="btn" onClick={onChangeMode}>
            Change mode
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
