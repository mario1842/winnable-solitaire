import { describe, expect, it } from 'vitest'
import { applyMove, dealKlondike, listMoves } from './board'
import { createDeck } from './cards'

describe('board', () => {
  it('deals 28 tableau + 24 stock', () => {
    const board = dealKlondike(createDeck(), 1)
    expect(board.tableau.map((c) => c.length)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(board.stock).toHaveLength(24)
    expect(board.waste).toHaveLength(0)
    for (let col = 0; col < 7; col++) {
      const column = board.tableau[col]
      expect(column[column.length - 1]?.faceUp).toBe(true)
      for (let i = 0; i < column.length - 1; i++) {
        expect(column[i]?.faceUp).toBe(false)
      }
    }
  })

  it('can draw from stock', () => {
    const board = dealKlondike(createDeck(), 1)
    const moves = listMoves(board)
    expect(moves.some((m) => m.kind === 'draw')).toBe(true)
    const next = applyMove(board, { kind: 'draw' })
    expect(next.waste).toHaveLength(1)
    expect(next.stock).toHaveLength(23)
    expect(next.waste[0]?.faceUp).toBe(true)
  })
})
