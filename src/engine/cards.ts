export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
export type DrawMode = 1 | 3

export const SUITS: readonly Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

export interface Card {
  id: string
  suit: Suit
  rank: Rank
  faceUp: boolean
}

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

export function suitColor(suit: Suit): 'red' | 'black' {
  return isRed(suit) ? 'red' : 'black'
}

export function rankLabel(rank: Rank): string {
  if (rank === 1) return 'A'
  if (rank === 11) return 'J'
  if (rank === 12) return 'Q'
  if (rank === 13) return 'K'
  return String(rank)
}

export function suitGlyph(suit: Suit): string {
  switch (suit) {
    case 'hearts':
      return '♥'
    case 'diamonds':
      return '♦'
    case 'clubs':
      return '♣'
    case 'spades':
      return '♠'
  }
}

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
      })
    }
  }
  return deck
}

export function cloneCard(card: Card): Card {
  return { ...card }
}

export function cloneCards(cards: readonly Card[]): Card[] {
  return cards.map(cloneCard)
}

export function shuffleInPlace<T>(arr: T[], random: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function canPlaceOnTableau(card: Card, target: Card | undefined): boolean {
  if (!target) return card.rank === 13
  return (
    suitColor(card.suit) !== suitColor(target.suit) && card.rank === target.rank - 1
  )
}

export function canPlaceOnFoundation(card: Card, foundation: readonly Card[]): boolean {
  if (foundation.length === 0) return card.rank === 1
  const top = foundation[foundation.length - 1]
  return card.suit === top.suit && card.rank === top.rank + 1
}

export function foundationIndex(suit: Suit): number {
  return SUITS.indexOf(suit)
}
