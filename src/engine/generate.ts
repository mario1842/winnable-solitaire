import { dealKlondike, type Board } from './board'
import {
  createDeck,
  shuffleInPlace,
  type Card,
  type DrawMode,
  type Rank,
  type Suit,
  SUITS,
} from './cards'
import { SEEDS_DRAW1, SEEDS_DRAW3 } from './seeds'
import { solve } from './solver'

export interface GenerateOptions {
  random?: () => number
  /** Extra fresh shuffles to try (verified). Keep low to avoid UI jank. */
  maxAttempts?: number
}

/**
 * Generate a guaranteed-winnable Klondike deal.
 *
 * Primary path: pre-verified seed + random suit isomorphism (instant, always solvable).
 * Optionally tries a few fresh solver-verified shuffles for extra variety.
 */
export function generateDeal(
  drawMode: DrawMode,
  options: GenerateOptions = {},
): Board {
  const random = options.random ?? Math.random
  // Live solver attempts are optional — seeds + suit isomorphisms are instant
  // and always winnable. Keep attempts at 0 by default to avoid UI jank.
  const maxAttempts = options.maxAttempts ?? 0

  for (let i = 0; i < maxAttempts; i++) {
    const deck = shuffleInPlace(createDeck(), random)
    const board = dealKlondike(deck, drawMode)
    const result = solve(board, {
      maxNodes: drawMode === 1 ? 8_000 : 10_000,
      maxDepth: 140,
    })
    if (result.solvable) return board
  }

  return dealFromSeed(drawMode, random)
}

export function dealFromSeed(
  drawMode: DrawMode,
  random: () => number = Math.random,
): Board {
  const bank = drawMode === 1 ? SEEDS_DRAW1 : SEEDS_DRAW3
  const order = bank[Math.floor(random() * bank.length)]!
  const map = randomSuitMap(random)
  const remapped = order.map((id) => remapCardId(id, map))
  return dealKlondike(remapped.map(parseCardId), drawMode)
}

/**
 * Suit remappings that preserve Klondike legality of a solved deal:
 * colors may stay or swap as a pair; within each color, suits may swap.
 */
function randomSuitMap(random: () => number): Record<Suit, Suit> {
  const reds: Suit[] = ['hearts', 'diamonds']
  const blacks: Suit[] = ['clubs', 'spades']
  shuffleInPlace(reds, random)
  shuffleInPlace(blacks, random)

  if (random() < 0.5) {
    return {
      hearts: reds[0]!,
      diamonds: reds[1]!,
      clubs: blacks[0]!,
      spades: blacks[1]!,
    }
  }
  // Swap color classes
  return {
    hearts: blacks[0]!,
    diamonds: blacks[1]!,
    clubs: reds[0]!,
    spades: reds[1]!,
  }
}

function remapCardId(id: string, map: Record<Suit, Suit>): string {
  const [suit, rank] = id.split('-') as [Suit, string]
  return `${map[suit]}-${rank}`
}

function parseCardId(id: string): Card {
  const [suit, rankStr] = id.split('-') as [Suit, string]
  return {
    id,
    suit,
    rank: Number(rankStr) as Rank,
    faceUp: false,
  }
}

/** Ensure every seed lists each card exactly once. */
export function assertSeedIntegrity(): void {
  for (const bank of [SEEDS_DRAW1, SEEDS_DRAW3]) {
    for (const order of bank) {
      if (order.length !== 52) {
        throw new Error(`Seed length ${order.length}, expected 52`)
      }
      const set = new Set(order)
      if (set.size !== 52) {
        throw new Error('Seed has duplicate cards')
      }
      for (const suit of SUITS) {
        for (let rank = 1; rank <= 13; rank++) {
          if (!set.has(`${suit}-${rank}`)) {
            throw new Error(`Seed missing ${suit}-${rank}`)
          }
        }
      }
    }
  }
}
