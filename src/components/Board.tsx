import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { suitGlyph, SUITS, type Card } from '../engine/cards'
import type { PileRef } from '../engine/board'
import {
  cardsFromSource,
  isHintCard,
  sourceCanDropOnFoundation,
  sourceCanDropOnTableau,
  type GameState,
} from '../engine/game'
import { CardView, EmptySlot } from './CardView'

export interface FlyAnim {
  card: Card
  from: { x: number; y: number; w: number; h: number }
  to: { x: number; y: number; w: number; h: number }
}

interface BoardProps {
  state: GameState
  onDrawStock: () => void
  onDrop: (from: PileRef, to: PileRef) => boolean
  onAutoFoundation: (ref: PileRef) => void
  animDrawIds: ReadonlySet<string>
  animPlaceIds: ReadonlySet<string>
  shuffling?: boolean
  fly?: FlyAnim | null
  inputLocked?: boolean
}

interface DragSession {
  source: PileRef
  cards: Card[]
  pointerId: number
  originX: number
  originY: number
  x: number
  y: number
  grabX: number
  grabY: number
  active: boolean
  width: number
}

const DRAG_THRESHOLD = 6

function cssPx(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name)
  return Number.parseFloat(raw) || fallback
}

function stackGap(faceUp: boolean): number {
  return faceUp ? cssPx('--stack-up', 32) : cssPx('--stack-down', 14)
}

function wasteFan(): number {
  return cssPx('--waste-fan', 27)
}

/** Cumulative Y offset — each card peeks by the gap of the card above it. */
function stackOffset(column: readonly Card[], index: number): number {
  let top = 0
  for (let i = 0; i < index; i++) {
    top += stackGap(column[i]!.faceUp)
  }
  return top
}

export function Board({
  state,
  onDrawStock,
  onDrop,
  onAutoFoundation,
  animDrawIds,
  animPlaceIds,
  shuffling = false,
  fly = null,
  inputLocked = false,
}: BoardProps) {
  const { board } = state
  const wasteTop = board.waste.length - 1
  const [drag, setDrag] = useState<DragSession | null>(null)
  const dragRef = useRef<DragSession | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  // Re-read CSS card metrics after orientation / viewport changes
  const [, setLayoutTick] = useState(0)
  useEffect(() => {
    const refresh = () => setLayoutTick((n) => n + 1)
    window.addEventListener('resize', refresh)
    window.addEventListener('orientationchange', refresh)
    return () => {
      window.removeEventListener('resize', refresh)
      window.removeEventListener('orientationchange', refresh)
    }
  }, [])

  const setDragBoth = useCallback((next: DragSession | null) => {
    dragRef.current = next
    setDrag(next)
  }, [])

  const beginDrag = useCallback(
    (source: PileRef, event: ReactPointerEvent) => {
      if (inputLocked || event.button !== 0) return
      const cards = cardsFromSource(board, source)
      if (cards.length === 0) return

      const target = event.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      const session: DragSession = {
        source,
        cards,
        pointerId: event.pointerId,
        originX: event.clientX,
        originY: event.clientY,
        x: rect.left,
        y: rect.top,
        grabX: event.clientX - rect.left,
        grabY: event.clientY - rect.top,
        active: false,
        width: rect.width,
      }
      setDragBoth(session)
      target.setPointerCapture?.(event.pointerId)
      event.preventDefault()
    },
    [board, inputLocked, setDragBoth],
  )

  useEffect(() => {
    if (!drag) return

    const onMove = (event: PointerEvent) => {
      const current = dragRef.current
      if (!current || event.pointerId !== current.pointerId) return

      const dx = event.clientX - current.originX
      const dy = event.clientY - current.originY
      const active =
        current.active || Math.hypot(dx, dy) >= DRAG_THRESHOLD

      setDragBoth({
        ...current,
        active,
        x: event.clientX - current.grabX,
        y: event.clientY - current.grabY,
      })
    }

    const onUp = (event: PointerEvent) => {
      const current = dragRef.current
      if (!current || event.pointerId !== current.pointerId) return

      if (current.active) {
        const el = document.elementFromPoint(event.clientX, event.clientY)
        const dropEl = el?.closest('[data-drop]') as HTMLElement | null
        const dropId = dropEl?.dataset.drop
        if (dropId) {
          const to = parseDropId(dropId)
          if (to) onDrop(current.source, to)
        }
      }

      setDragBoth(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [drag, onDrop, setDragBoth])

  const draggingSource = drag?.active ? drag.source : null
  const dropHighlight = drag?.active ? drag.source : null

  const isDraggedCard = (ref: PileRef): boolean => {
    if (!draggingSource) return false
    if (draggingSource.type === 'waste' && ref.type === 'waste') return true
    if (
      draggingSource.type === 'foundation' &&
      ref.type === 'foundation' &&
      draggingSource.index === ref.index
    ) {
      return true
    }
    if (
      draggingSource.type === 'tableau' &&
      ref.type === 'tableau' &&
      draggingSource.col === ref.col &&
      ref.index >= draggingSource.index
    ) {
      return true
    }
    return false
  }

  return (
    <div className={`board-wrap${inputLocked ? ' input-locked' : ''}`}>
      <div className={`board${drag?.active ? ' is-dragging' : ''}`} ref={boardRef}>
        <div className="board-top">
          <div className={`stock-waste${shuffling ? ' is-shuffling' : ''}`}>
            {board.stock.length > 0 || shuffling ? (
              <button
                type="button"
                className={`card card-back stock-pile${isHintCard(state, { type: 'stock' }) ? ' hint' : ''}${shuffling ? ' shuffling' : ''}`}
                onClick={onDrawStock}
                disabled={shuffling || inputLocked}
                aria-label={
                  shuffling
                    ? 'Shuffling stock'
                    : `Stock, ${board.stock.length} cards — click to draw`
                }
              />
            ) : (
              <EmptySlot
                label={board.waste.length > 0 ? '↺' : ''}
                onClick={onDrawStock}
              />
            )}

            <div className={`waste${shuffling ? ' shuffling' : ''}`} data-drop-zone="waste">
              {board.waste.length === 0 ? (
                <EmptySlot label="" />
              ) : (
                board.waste.slice(-Math.min(3, board.waste.length)).map((card, i, arr) => {
                  const absIndex = board.waste.length - arr.length + i
                  const isTop = absIndex === wasteTop
                  const ref: PileRef = { type: 'waste' }
                  return (
                    <div
                      key={`${card.id}-${absIndex}`}
                      className="waste-card"
                      data-card-id={isTop ? card.id : undefined}
                      style={{
                        left: i * wasteFan(),
                        animationDelay: shuffling ? `${(arr.length - 1 - i) * 45}ms` : undefined,
                      }}
                    >
                      <CardView
                        card={card}
                        hinted={isTop && isHintCard(state, ref)}
                        dimmed={
                          (isTop && isDraggedCard(ref)) ||
                          (!!fly && fly.card.id === card.id)
                        }
                        anim={
                          isTop && animDrawIds.has(card.id)
                            ? 'draw'
                            : animPlaceIds.has(card.id)
                              ? 'place'
                              : null
                        }
                        draggable={isTop && !inputLocked}
                        onPointerDown={
                          isTop && !inputLocked
                            ? (e) => beginDrag(ref, e)
                            : undefined
                        }
                        onDoubleClick={
                          isTop && !inputLocked
                            ? () => onAutoFoundation(ref)
                            : undefined
                        }
                      />
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="foundations">
            {SUITS.map((suit, index) => {
              const pile = board.foundations[index]
              const top = pile[pile.length - 1]
              const dropId = `foundation:${index}`
              const active =
                !!dropHighlight &&
                sourceCanDropOnFoundation(board, dropHighlight, index)
              if (!top) {
                return (
                  <EmptySlot
                    key={suit}
                    label={suitGlyph(suit)}
                    active={active}
                    dropId={dropId}
                    suitClass={`suit-${suit}`}
                  />
                )
              }
              const ref: PileRef = { type: 'foundation', index }
              return (
                <div
                  key={suit}
                  data-drop={dropId}
                  data-card-id={top.id}
                  className={active ? 'drop-wrap active' : 'drop-wrap'}
                >
                  <CardView
                    card={top}
                    hinted={isHintCard(state, ref)}
                    dimmed={isDraggedCard(ref) || (!!fly && fly.card.id === top.id)}
                    anim={animPlaceIds.has(top.id) ? 'place' : null}
                    draggable={!inputLocked}
                    onPointerDown={
                      !inputLocked ? (e) => beginDrag(ref, e) : undefined
                    }
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="tableau">
          {board.tableau.map((column, col) => {
            const dropId = `tableau:${col}`
            const active =
              !!dropHighlight && sourceCanDropOnTableau(board, dropHighlight, col)
            return (
              <div
                key={col}
                className={`tableau-col${active ? ' drop-target-col' : ''}`}
                data-drop={dropId}
              >
                {column.length === 0 ? (
                  <EmptySlot active={active} dropId={dropId} />
                ) : (
                  column.map((card, index) => {
                    const ref: PileRef = { type: 'tableau', col, index }
                    const top = stackOffset(column, index)
                    return (
                      <div
                        key={card.id}
                        className="tableau-card"
                        data-card-id={card.id}
                        style={{ top }}
                      >
                        <CardView
                          card={card}
                          stacked
                          hinted={isHintCard(state, ref)}
                          dimmed={
                            isDraggedCard(ref) || (!!fly && fly.card.id === card.id)
                          }
                          anim={
                            animPlaceIds.has(card.id)
                              ? 'place'
                              : animDrawIds.has(card.id)
                                ? 'draw'
                                : null
                          }
                          draggable={card.faceUp && !inputLocked}
                          onPointerDown={
                            card.faceUp && !inputLocked
                              ? (e) => beginDrag(ref, e)
                              : undefined
                          }
                          onDoubleClick={
                            !inputLocked
                              ? () => onAutoFoundation(ref)
                              : undefined
                          }
                        />
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      </div>

      {drag?.active ? (
        <div
          className="drag-ghost"
          style={{
            left: drag.x,
            top: drag.y,
            width: drag.width,
          }}
        >
          {drag.cards.map((card, i) => (
            <div
              key={card.id}
              className="drag-ghost-card"
              style={{ top: i * stackGap(true) }}
            >
              <CardView card={card} stacked dragging />
            </div>
          ))}
        </div>
      ) : null}

      {fly ? (
        <div
          className="fly-card"
          style={
            {
              '--fly-x0': `${fly.from.x}px`,
              '--fly-y0': `${fly.from.y}px`,
              '--fly-x1': `${fly.to.x}px`,
              '--fly-y1': `${fly.to.y}px`,
            } as CSSProperties
          }
        >
          <CardView card={fly.card} dragging />
        </div>
      ) : null}
    </div>
  )
}

function parseDropId(id: string): PileRef | null {
  const [kind, raw] = id.split(':')
  if (kind === 'foundation') {
    return { type: 'foundation', index: Number(raw) }
  }
  if (kind === 'tableau') {
    return { type: 'tableau', col: Number(raw), index: 0 }
  }
  return null
}
