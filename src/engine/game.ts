import {
  applyMove,
  cardsLeft,
  cloneBoard,
  isWon,
  listMoves,
  type Board,
  type Move,
  type PileRef,
} from './board'
import {
  canPlaceOnFoundation,
  canPlaceOnTableau,
  foundationIndex,
  type Card,
  type DrawMode,
} from './cards'
import { generateDeal } from './generate'

export const FOUNDATION_SCORE = 10
export const TABLEAU_SCORE = 5
export const WASTE_TO_TABLEAU_SCORE = 5
export const HINT_PENALTY = 20
export const UNDO_PENALTY = 5

export type GameStatus = 'playing' | 'won'

export interface Selection {
  source: PileRef
}

export interface GameState {
  board: Board
  selected: Selection | null
  hintMove: Move | null
  history: Board[]
  score: number
  moves: number
  elapsedMs: number
  status: GameStatus
  drawMode: DrawMode
}

export function createGame(drawMode: DrawMode): GameState {
  const board = generateDeal(drawMode)
  return {
    board,
    selected: null,
    hintMove: null,
    history: [],
    score: 0,
    moves: 0,
    elapsedMs: 0,
    status: 'playing',
    drawMode,
  }
}

export function newDeal(state: GameState): GameState {
  return createGame(state.drawMode)
}

function pushHistory(state: GameState): Board[] {
  return [...state.history, cloneBoard(state.board)]
}

function afterMove(state: GameState, board: Board, scoreDelta: number): GameState {
  const won = isWon(board)
  return {
    ...state,
    board,
    selected: null,
    hintMove: null,
    history: pushHistory(state),
    score: Math.max(0, state.score + scoreDelta),
    moves: state.moves + 1,
    status: won ? 'won' : 'playing',
  }
}

export function drawStock(state: GameState): GameState {
  if (state.status !== 'playing') return state
  const moves = listMoves(state.board)
  const draw = moves.find((m) => m.kind === 'draw')
  const recycle = moves.find((m) => m.kind === 'recycle')
  const move = draw ?? recycle
  if (!move) return state
  const board = applyMove(state.board, move)
  return afterMove(state, board, move.kind === 'recycle' ? -5 : 0)
}

/** Click stock only — cards are moved by drag-and-drop. */
export function clickStock(state: GameState): GameState {
  if (state.status !== 'playing') return state
  return drawStock({ ...state, selected: null, hintMove: null })
}

/**
 * Drag-and-drop move: source → destination.
 * Returns the same state (cleared selection) if the drop is illegal.
 */
export function dropCards(state: GameState, from: PileRef, to: PileRef): GameState {
  if (state.status !== 'playing') return state
  const cleared = { ...state, selected: null, hintMove: null }

  if (from.type === 'waste') {
    if (to.type === 'foundation') {
      const waste = state.board.waste[state.board.waste.length - 1]
      if (!waste || foundationIndex(waste.suit) !== to.index) return cleared
      const move = listMoves(state.board).find((m) => m.kind === 'waste-to-foundation')
      if (!move) return cleared
      return afterMove(state, applyMove(state.board, move), FOUNDATION_SCORE)
    }
    if (to.type === 'tableau') {
      const move = listMoves(state.board).find(
        (m) => m.kind === 'waste-to-tableau' && m.col === to.col,
      )
      if (!move) return cleared
      return afterMove(state, applyMove(state.board, move), WASTE_TO_TABLEAU_SCORE)
    }
  }

  if (from.type === 'tableau') {
    if (to.type === 'foundation') {
      const col = state.board.tableau[from.col]
      if (from.index !== col.length - 1) return cleared
      const card = col[from.index]
      if (!card || foundationIndex(card.suit) !== to.index) return cleared
      const move = listMoves(state.board).find(
        (m) => m.kind === 'tableau-to-foundation' && m.col === from.col,
      )
      if (!move) return cleared
      return afterMove(state, applyMove(state.board, move), FOUNDATION_SCORE)
    }
    if (to.type === 'tableau') {
      if (from.col === to.col) return cleared
      const count = state.board.tableau[from.col].length - from.index
      const move = listMoves(state.board).find(
        (m) =>
          m.kind === 'tableau-to-tableau' &&
          m.from === from.col &&
          m.to === to.col &&
          m.count === count,
      )
      if (!move) return cleared
      return afterMove(state, applyMove(state.board, move), TABLEAU_SCORE)
    }
  }

  if (from.type === 'foundation' && to.type === 'tableau') {
    const move = listMoves(state.board).find(
      (m) =>
        m.kind === 'foundation-to-tableau' &&
        m.foundation === from.index &&
        m.col === to.col,
    )
    if (!move) return cleared
    return afterMove(state, applyMove(state.board, move), -FOUNDATION_SCORE)
  }

  return cleared
}

/** Cards that would be dragged from this source. */
export function cardsFromSource(board: Board, src: PileRef): Card[] {
  if (src.type === 'waste') {
    const top = board.waste[board.waste.length - 1]
    return top ? [top] : []
  }
  if (src.type === 'foundation') {
    const pile = board.foundations[src.index]
    const top = pile[pile.length - 1]
    return top ? [top] : []
  }
  if (src.type === 'tableau') {
    return board.tableau[src.col].slice(src.index).filter((c) => c.faceUp)
  }
  return []
}

export function sourceCanDropOnFoundation(
  board: Board,
  src: PileRef,
  index: number,
): boolean {
  const cards = cardsFromSource(board, src)
  if (cards.length !== 1) return false
  const card = cards[0]!
  return (
    foundationIndex(card.suit) === index &&
    canPlaceOnFoundation(card, board.foundations[index])
  )
}

export function sourceCanDropOnTableau(board: Board, src: PileRef, col: number): boolean {
  if (src.type === 'tableau' && src.col === col) return false
  const cards = cardsFromSource(board, src)
  if (cards.length === 0) return false
  const moving = cards[0]!
  const target = board.tableau[col][board.tableau[col].length - 1]
  return canPlaceOnTableau(moving, target)
}

/** Double-click / auto: send card to foundation if possible. */
export function autoFoundation(state: GameState, ref: PileRef): GameState {
  if (state.status !== 'playing') return state

  if (ref.type === 'waste') {
    const move = listMoves(state.board).find((m) => m.kind === 'waste-to-foundation')
    if (!move) return state
    return afterMove(state, applyMove(state.board, move), FOUNDATION_SCORE)
  }

  if (ref.type === 'tableau') {
    const col = state.board.tableau[ref.col]
    if (ref.index !== col.length - 1) return state
    const move = listMoves(state.board).find(
      (m) => m.kind === 'tableau-to-foundation' && m.col === ref.col,
    )
    if (!move) return state
    return afterMove(state, applyMove(state.board, move), FOUNDATION_SCORE)
  }

  return state
}

export function undo(state: GameState): GameState {
  if (state.history.length === 0) return state
  const history = [...state.history]
  const board = history.pop()!
  return {
    ...state,
    board,
    history,
    selected: null,
    hintMove: null,
    score: Math.max(0, state.score - UNDO_PENALTY),
    moves: Math.max(0, state.moves - 1),
    status: isWon(board) ? 'won' : 'playing',
  }
}

export function applyHint(state: GameState): GameState {
  if (state.status !== 'playing') return state
  const moves = listMoves(state.board)
  const priority = [
    ...moves.filter((m) => m.kind === 'waste-to-foundation'),
    ...moves.filter((m) => m.kind === 'tableau-to-foundation'),
    ...moves.filter((m) => m.kind === 'waste-to-tableau'),
    ...moves.filter((m) => m.kind === 'tableau-to-tableau'),
    ...moves.filter((m) => m.kind === 'draw'),
    ...moves.filter((m) => m.kind === 'recycle'),
  ]
  const hintMove = priority[0] ?? null
  if (!hintMove) return state
  return {
    ...state,
    hintMove,
    selected: null,
    score: Math.max(0, state.score - HINT_PENALTY),
  }
}

export function tick(state: GameState, deltaMs: number): GameState {
  if (state.status !== 'playing') return state
  return { ...state, elapsedMs: state.elapsedMs + deltaMs }
}

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function remaining(state: GameState): number {
  return cardsLeft(state.board)
}

export function isSelectedCard(state: GameState, ref: PileRef): boolean {
  const src = state.selected?.source
  if (!src) return false
  if (src.type === 'waste' && ref.type === 'waste') return true
  if (src.type === 'foundation' && ref.type === 'foundation') {
    return src.index === ref.index
  }
  if (src.type === 'tableau' && ref.type === 'tableau') {
    if (src.col !== ref.col) return false
    return ref.index >= src.index
  }
  return false
}

export function isHintCard(state: GameState, ref: PileRef): boolean {
  const hint = state.hintMove
  if (!hint) return false

  switch (hint.kind) {
    case 'draw':
    case 'recycle':
      return ref.type === 'stock'
    case 'waste-to-foundation':
    case 'waste-to-tableau':
      return ref.type === 'waste'
    case 'tableau-to-foundation':
      return (
        ref.type === 'tableau' &&
        ref.col === hint.col &&
        ref.index === state.board.tableau[hint.col].length - 1
      )
    case 'tableau-to-tableau':
      return (
        ref.type === 'tableau' &&
        ref.col === hint.from &&
        ref.index >= state.board.tableau[hint.from].length - hint.count
      )
    case 'foundation-to-tableau':
      return ref.type === 'foundation' && ref.index === hint.foundation
  }
}

export function canDropOnFoundation(state: GameState, index: number): boolean {
  const src = state.selected?.source
  if (!src) return false
  return sourceCanDropOnFoundation(state.board, src, index)
}

export function canDropOnTableau(state: GameState, col: number): boolean {
  const src = state.selected?.source
  if (!src) return false
  return sourceCanDropOnTableau(state.board, src, col)
}

/** Stock + waste empty — only tableau cards left. */
export function deckIsClear(board: Board): boolean {
  return board.stock.length === 0 && board.waste.length === 0
}

/**
 * Next card that can go to a foundation (lowest rank first for a smooth cascade).
 */
export function nextAutoFoundationMove(
  board: Board,
): Extract<Move, { kind: 'tableau-to-foundation' }> | null {
  const candidates = listMoves(board).filter(
    (m): m is Extract<Move, { kind: 'tableau-to-foundation' }> =>
      m.kind === 'tableau-to-foundation',
  )
  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    const cardA = board.tableau[a.col][board.tableau[a.col].length - 1]!
    const cardB = board.tableau[b.col][board.tableau[b.col].length - 1]!
    return cardA.rank - cardB.rank
  })
  return candidates[0] ?? null
}

/** True when foundation-only play clears the board (safe to auto-finish). */
export function canAutoComplete(board: Board): boolean {
  if (!deckIsClear(board)) return false
  if (isWon(board)) return false

  let current = cloneBoard(board)
  let guard = 0
  while (!isWon(current) && guard++ < 60) {
    const move = nextAutoFoundationMove(current)
    if (!move) return false
    current = applyMove(current, move)
  }
  return isWon(current)
}

export function applyAutoFoundationMove(
  state: GameState,
  move: Extract<Move, { kind: 'tableau-to-foundation' }>,
): GameState {
  if (state.status !== 'playing') return state
  return afterMove(state, applyMove(state.board, move), FOUNDATION_SCORE)
}

export function cardForAutoMove(
  board: Board,
  move: Extract<Move, { kind: 'tableau-to-foundation' }>,
): Card | undefined {
  const col = board.tableau[move.col]
  return col[col.length - 1]
}
