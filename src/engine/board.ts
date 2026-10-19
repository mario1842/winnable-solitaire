import {
  canPlaceOnFoundation,
  canPlaceOnTableau,
  cloneCards,
  type Card,
  type DrawMode,
  type Suit,
  foundationIndex,
  SUITS,
} from './cards'

export interface Board {
  tableau: Card[][]
  foundations: Card[][]
  stock: Card[]
  waste: Card[]
  drawMode: DrawMode
}

export type PileRef =
  | { type: 'tableau'; col: number; index: number }
  | { type: 'waste' }
  | { type: 'foundation'; index: number }
  | { type: 'stock' }

export function emptyBoard(drawMode: DrawMode): Board {
  return {
    tableau: Array.from({ length: 7 }, () => []),
    foundations: Array.from({ length: 4 }, () => []),
    stock: [],
    waste: [],
    drawMode,
  }
}

export function cloneBoard(board: Board): Board {
  return {
    tableau: board.tableau.map(cloneCards),
    foundations: board.foundations.map(cloneCards),
    stock: cloneCards(board.stock),
    waste: cloneCards(board.waste),
    drawMode: board.drawMode,
  }
}

/** Standard Klondike deal: 28 tableau cards (columns 1..7), 24 stock. */
export function dealKlondike(deck: Card[], drawMode: DrawMode): Board {
  const board = emptyBoard(drawMode)
  const cards = cloneCards(deck)
  let i = 0

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = cards[i++]
      card.faceUp = row === col
      board.tableau[col].push(card)
    }
  }

  while (i < cards.length) {
    const card = cards[i++]
    card.faceUp = false
    board.stock.push(card)
  }

  return board
}

export function foundationTop(board: Board, suit: Suit): Card | undefined {
  const pile = board.foundations[foundationIndex(suit)]
  return pile[pile.length - 1]
}

export function isWon(board: Board): boolean {
  return board.foundations.every((f) => f.length === 13)
}

export function cardsLeft(board: Board): number {
  return (
    52 -
    board.foundations.reduce((sum, f) => sum + f.length, 0)
  )
}

export function faceUpRunStart(column: readonly Card[]): number {
  let start = column.length
  for (let i = column.length - 1; i >= 0; i--) {
    if (!column[i].faceUp) break
    start = i
  }
  return start
}

/** Contiguous movable face-up build starting at index. */
export function isValidBuild(column: readonly Card[], fromIndex: number): boolean {
  if (fromIndex < 0 || fromIndex >= column.length) return false
  if (!column[fromIndex].faceUp) return false
  for (let i = fromIndex; i < column.length - 1; i++) {
    const a = column[i]
    const b = column[i + 1]
    if (!b.faceUp) return false
    if (!canPlaceOnTableau(b, a)) return false
  }
  return true
}

export function flipTopIfNeeded(column: Card[]): void {
  if (column.length === 0) return
  const top = column[column.length - 1]
  if (!top.faceUp) top.faceUp = true
}

export type Move =
  | { kind: 'draw' }
  | { kind: 'recycle' }
  | { kind: 'waste-to-foundation' }
  | { kind: 'waste-to-tableau'; col: number }
  | { kind: 'tableau-to-foundation'; col: number }
  | { kind: 'tableau-to-tableau'; from: number; to: number; count: number }
  | { kind: 'foundation-to-tableau'; foundation: number; col: number }

export function listMoves(board: Board): Move[] {
  const moves: Move[] = []

  if (board.stock.length > 0) {
    moves.push({ kind: 'draw' })
  } else if (board.waste.length > 0) {
    moves.push({ kind: 'recycle' })
  }

  if (board.waste.length > 0) {
    const waste = board.waste[board.waste.length - 1]
    if (canPlaceOnFoundation(waste, board.foundations[foundationIndex(waste.suit)])) {
      moves.push({ kind: 'waste-to-foundation' })
    }
    for (let col = 0; col < 7; col++) {
      const target = board.tableau[col][board.tableau[col].length - 1]
      if (canPlaceOnTableau(waste, target)) {
        moves.push({ kind: 'waste-to-tableau', col })
      }
    }
  }

  for (let col = 0; col < 7; col++) {
    const column = board.tableau[col]
    if (column.length === 0) continue
    const top = column[column.length - 1]
    if (
      top.faceUp &&
      canPlaceOnFoundation(top, board.foundations[foundationIndex(top.suit)])
    ) {
      moves.push({ kind: 'tableau-to-foundation', col })
    }

    const runStart = faceUpRunStart(column)
    for (let index = runStart; index < column.length; index++) {
      if (!isValidBuild(column, index)) continue
      const moving = column[index]
      const count = column.length - index
      for (let to = 0; to < 7; to++) {
        if (to === col) continue
        const target = board.tableau[to][board.tableau[to].length - 1]
        if (canPlaceOnTableau(moving, target)) {
          // Skip no-op king-to-empty when source becomes empty
          if (!target && index === 0) continue
          moves.push({ kind: 'tableau-to-tableau', from: col, to, count })
        }
      }
    }
  }

  for (let f = 0; f < 4; f++) {
    const pile = board.foundations[f]
    if (pile.length === 0) continue
    const card = pile[pile.length - 1]
    for (let col = 0; col < 7; col++) {
      const target = board.tableau[col][board.tableau[col].length - 1]
      if (canPlaceOnTableau(card, target)) {
        moves.push({ kind: 'foundation-to-tableau', foundation: f, col })
      }
    }
  }

  return moves
}

export function applyMove(board: Board, move: Move): Board {
  const next = cloneBoard(board)

  switch (move.kind) {
    case 'draw': {
      const n = Math.min(next.drawMode, next.stock.length)
      for (let i = 0; i < n; i++) {
        const card = next.stock.pop()!
        card.faceUp = true
        next.waste.push(card)
      }
      break
    }
    case 'recycle': {
      while (next.waste.length > 0) {
        const card = next.waste.pop()!
        card.faceUp = false
        next.stock.push(card)
      }
      break
    }
    case 'waste-to-foundation': {
      const card = next.waste.pop()!
      next.foundations[foundationIndex(card.suit)].push(card)
      break
    }
    case 'waste-to-tableau': {
      const card = next.waste.pop()!
      next.tableau[move.col].push(card)
      break
    }
    case 'tableau-to-foundation': {
      const column = next.tableau[move.col]
      const card = column.pop()!
      next.foundations[foundationIndex(card.suit)].push(card)
      flipTopIfNeeded(column)
      break
    }
    case 'tableau-to-tableau': {
      const from = next.tableau[move.from]
      const chunk = from.splice(from.length - move.count, move.count)
      next.tableau[move.to].push(...chunk)
      flipTopIfNeeded(from)
      break
    }
    case 'foundation-to-tableau': {
      const card = next.foundations[move.foundation].pop()!
      next.tableau[move.col].push(card)
      break
    }
  }

  return next
}

export function boardKey(board: Board): string {
  const tab = board.tableau
    .map((col) =>
      col.map((c) => `${c.suit[0]}${c.rank}${c.faceUp ? '+' : '-'}`).join(''),
    )
    .join('|')
  const found = board.foundations.map((f) => f.length).join(',')
  const stock = board.stock.map((c) => `${c.suit[0]}${c.rank}`).join('')
  const waste = board.waste.map((c) => `${c.suit[0]}${c.rank}`).join('')
  return `${tab}#${found}#${stock}#${waste}#${board.drawMode}`
}

export function suitOfFoundation(index: number): Suit {
  return SUITS[index]
}
