import { describe, expect, it } from 'vitest'
import { isWon } from './board'
import { assertSeedIntegrity, dealFromSeed, generateDeal } from './generate'
import { solve } from './solver'

describe('generate', () => {
  it('has intact seed banks', () => {
    expect(() => assertSeedIntegrity()).not.toThrow()
  })

  it('seed deals are solvable (draw 1)', () => {
    const board = dealFromSeed(1, () => 0.1)
    const result = solve(board, { maxNodes: 100_000, maxDepth: 300 })
    expect(result.solvable).toBe(true)
  })

  it('seed deals are solvable (draw 3)', () => {
    const board = dealFromSeed(3, () => 0.2)
    const result = solve(board, { maxNodes: 120_000, maxDepth: 300 })
    expect(result.solvable).toBe(true)
  })

  it('generateDeal returns a full board', () => {
    const board = generateDeal(1, { maxAttempts: 0, random: () => 0.42 })
    const total =
      board.tableau.reduce((n, c) => n + c.length, 0) +
      board.stock.length +
      board.waste.length +
      board.foundations.reduce((n, f) => n + f.length, 0)
    expect(total).toBe(52)
    expect(isWon(board)).toBe(false)
  })
})
