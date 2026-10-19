import {
  applyMove,
  boardKey,
  isWon,
  listMoves,
  type Board,
  type Move,
} from './board'
import { canPlaceOnFoundation, foundationIndex } from './cards'

export interface SolveOptions {
  maxNodes?: number
  maxDepth?: number
}

export interface SolveResult {
  solvable: boolean
  nodes: number
  moves?: Move[]
}

/**
 * Depth-first search with safe autoplay + move ordering.
 * Fast enough to verify deals in the browser during generation.
 */
export function solve(board: Board, options: SolveOptions = {}): SolveResult {
  const maxNodes = options.maxNodes ?? 80_000
  const maxDepth = options.maxDepth ?? 250
  const seen = new Set<string>()
  let nodes = 0
  const path: Move[] = []

  function rankMove(move: Move): number {
    switch (move.kind) {
      case 'waste-to-foundation':
        return 0
      case 'tableau-to-foundation':
        return 1
      case 'waste-to-tableau':
        return 2
      case 'tableau-to-tableau':
        return 3
      case 'draw':
        return 4
      case 'recycle':
        return 5
      case 'foundation-to-tableau':
        return 9
    }
  }

  /** Apply all unambiguously safe foundation moves. */
  function autoplay(current: Board): { board: Board; applied: Move[] } {
    let board = current
    const applied: Move[] = []
    let guard = 0
    while (guard++ < 60) {
      const moves = listMoves(board)
      const safe = moves.find((m) => isSafeFoundationMove(board, m))
      if (!safe) break
      board = applyMove(board, safe)
      applied.push(safe)
    }
    return { board, applied }
  }

  function dfs(current: Board, depth: number, recycleCount: number): boolean {
    const { board: autoBoard, applied } = autoplay(current)
    for (const m of applied) path.push(m)

    if (isWon(autoBoard)) return true
    if (nodes >= maxNodes || depth >= maxDepth) {
      for (let i = 0; i < applied.length; i++) path.pop()
      return false
    }

    const key = boardKey(autoBoard)
    if (seen.has(key)) {
      for (let i = 0; i < applied.length; i++) path.pop()
      return false
    }
    seen.add(key)
    nodes++

    const moves = listMoves(autoBoard)
      .filter((m) => m.kind !== 'foundation-to-tableau')
      .sort((a, b) => rankMove(a) - rankMove(b))

    for (const move of moves) {
      let nextRecycle = recycleCount
      if (move.kind === 'recycle') {
        nextRecycle++
        if (nextRecycle > 6) continue
      } else if (move.kind !== 'draw') {
        nextRecycle = 0
      }

      const next = applyMove(autoBoard, move)
      path.push(move)
      if (dfs(next, depth + 1, nextRecycle)) return true
      path.pop()
    }

    for (let i = 0; i < applied.length; i++) path.pop()
    return false
  }

  const solvable = dfs(board, 0, 0)
  return {
    solvable,
    nodes,
    moves: solvable ? [...path] : undefined,
  }
}

function isSafeFoundationMove(board: Board, move: Move): boolean {
  if (move.kind === 'waste-to-foundation') {
    const card = board.waste[board.waste.length - 1]
    return !!card && isSafeToFoundation(board, card.suit, card.rank)
  }
  if (move.kind === 'tableau-to-foundation') {
    const col = board.tableau[move.col]
    const card = col[col.length - 1]
    return !!card && isSafeToFoundation(board, card.suit, card.rank)
  }
  return false
}

/**
 * Safe if both opposite-color foundations are at least rank-1
 * (classic Klondike "don't block" heuristic), or card is Ace/2.
 */
function isSafeToFoundation(
  board: Board,
  suit: import('./cards').Suit,
  rank: number,
): boolean {
  if (rank <= 2) return true
  const foundations = board.foundations
  const idx = foundationIndex(suit)
  if (!canPlaceOnFoundation(
    { id: '', suit, rank: rank as import('./cards').Rank, faceUp: true },
    foundations[idx],
  )) {
    return false
  }

  // Opposite colors must be caught up enough
  const red = suit === 'hearts' || suit === 'diamonds'
  let minOpposite = 13
  for (let i = 0; i < 4; i++) {
    const s = foundations[i]
    const topRank = s.length
    const isRed = i === 0 || i === 1 // hearts, diamonds
    if (isRed !== red) minOpposite = Math.min(minOpposite, topRank)
  }
  return minOpposite >= rank - 1
}

export function isLikelySolvable(board: Board): boolean {
  return solve(board, { maxNodes: 40_000, maxDepth: 200 }).solvable
}
