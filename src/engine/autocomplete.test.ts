import { describe, expect, it } from 'vitest'
import { applyMove, dealKlondike, emptyBoard, isWon } from './board'
import { createDeck, SUITS, type Rank } from './cards'
import {
  canAutoComplete,
  deckIsClear,
  nextAutoFoundationMove,
} from './game'

describe('autocomplete', () => {
  it('detects a clear deck', () => {
    const board = dealKlondike(createDeck(), 1)
    expect(deckIsClear(board)).toBe(false)
    board.stock = []
    board.waste = []
    expect(deckIsClear(board)).toBe(true)
  })

  it('finds a foundation move for a free ace', () => {
    const board = emptyBoard(1)
    board.tableau[0] = [
      { id: 'hearts-1', suit: 'hearts', rank: 1, faceUp: true },
    ]
    const move = nextAutoFoundationMove(board)
    expect(move).toEqual({ kind: 'tableau-to-foundation', col: 0 })
  })

  it('can auto-complete when only foundation plays remain', () => {
    const board = emptyBoard(1)
    for (let s = 0; s < 4; s++) {
      const suit = SUITS[s]!
      for (let r = 1; r <= 12; r++) {
        board.foundations[s]!.push({
          id: `${suit}-${r}`,
          suit,
          rank: r as Rank,
          faceUp: true,
        })
      }
      board.tableau[s]!.push({
        id: `${suit}-13`,
        suit,
        rank: 13,
        faceUp: true,
      })
    }

    expect(canAutoComplete(board)).toBe(true)

    let current = board
    let steps = 0
    while (!isWon(current) && steps++ < 10) {
      const move = nextAutoFoundationMove(current)
      expect(move).not.toBeNull()
      current = applyMove(current, move!)
    }
    expect(isWon(current)).toBe(true)
  })
})
