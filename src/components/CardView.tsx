import type { PointerEvent as ReactPointerEvent } from 'react'
import { rankLabel, suitGlyph, type Card } from '../engine/cards'

interface CardViewProps {
  card: Card
  selected?: boolean
  hinted?: boolean
  stacked?: boolean
  dragging?: boolean
  anim?: 'draw' | 'place' | null
  dimmed?: boolean
  draggable?: boolean
  onPointerDown?: (event: ReactPointerEvent) => void
  onDoubleClick?: () => void
}

export function CardView({
  card,
  selected,
  hinted,
  stacked,
  dragging,
  anim,
  dimmed,
  draggable,
  onPointerDown,
  onDoubleClick,
}: CardViewProps) {
  const animClass = anim === 'draw' ? ' anim-draw' : anim === 'place' ? ' anim-place' : ''

  if (!card.faceUp) {
    return (
      <div
        className={`card card-back${stacked ? ' stacked' : ''}${dimmed ? ' dimmed' : ''}${animClass}`}
        aria-label="Face-down card"
      />
    )
  }

  const label = `${rankLabel(card.rank)}${suitGlyph(card.suit)}`

  return (
    <div
      role="button"
      tabIndex={draggable ? 0 : -1}
      className={`card card-face suit-${card.suit}${selected ? ' selected' : ''}${hinted ? ' hint' : ''}${stacked ? ' stacked' : ''}${dragging ? ' dragging' : ''}${dimmed ? ' dimmed' : ''}${draggable ? ' draggable' : ''}${animClass}`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      aria-label={label}
    >
      <span className="corner top">
        <span className="rank">{rankLabel(card.rank)}</span>
        <span className="suit">{suitGlyph(card.suit)}</span>
      </span>
      <span className="pip-center">{suitGlyph(card.suit)}</span>
      <span className="corner bottom">
        <span className="rank">{rankLabel(card.rank)}</span>
        <span className="suit">{suitGlyph(card.suit)}</span>
      </span>
    </div>
  )
}

export function EmptySlot({
  label,
  active,
  onClick,
  dropId,
  suitClass,
}: {
  label?: string
  active?: boolean
  onClick?: () => void
  dropId?: string
  suitClass?: string
}) {
  return (
    <button
      type="button"
      className={`card card-slot${active ? ' drop-target' : ''}${suitClass ? ` ${suitClass}` : ''}`}
      onClick={onClick}
      data-drop={dropId}
      aria-label={label ?? 'Empty slot'}
    >
      {label ? <span className="slot-label">{label}</span> : null}
    </button>
  )
}
