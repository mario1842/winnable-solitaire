import { describe, expect, it } from 'vitest'
import {
  canPlaceOnFoundation,
  canPlaceOnTableau,
  createDeck,
  isRed,
  rankLabel,
} from './cards'

describe('cards', () => {
  it('creates a 52-card deck', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(52)
    const ids = new Set(deck.map((c) => c.id))
    expect(ids.size).toBe(52)
  })

  it('labels ranks', () => {
    expect(rankLabel(1)).toBe('A')
    expect(rankLabel(10)).toBe('10')
    expect(rankLabel(13)).toBe('K')
  })

  it('places on tableau with alternating colors', () => {
    const black = { id: 'c', suit: 'clubs' as const, rank: 12 as const, faceUp: true }
    const red = { id: 'h', suit: 'hearts' as const, rank: 11 as const, faceUp: true }
    expect(canPlaceOnTableau(red, black)).toBe(true)
    expect(canPlaceOnTableau(black, red)).toBe(false)
    expect(canPlaceOnTableau({ ...black, rank: 13 }, undefined)).toBe(true)
  })

  it('builds foundations by suit', () => {
    const ace = { id: 'a', suit: 'hearts' as const, rank: 1 as const, faceUp: true }
    const two = { id: '2', suit: 'hearts' as const, rank: 2 as const, faceUp: true }
    expect(canPlaceOnFoundation(ace, [])).toBe(true)
    expect(canPlaceOnFoundation(two, [])).toBe(false)
    expect(canPlaceOnFoundation(two, [ace])).toBe(true)
    expect(isRed('hearts')).toBe(true)
  })
})
