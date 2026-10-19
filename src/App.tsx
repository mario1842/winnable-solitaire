import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import {
  playCardPlace,
  playDraw,
  playFoundation,
  playShuffle,
  playUiClick,
  playWin,
} from './audio/sounds'
import { Board, type FlyAnim } from './components/Board'
import { GameOverModal } from './components/GameOverModal'
import { Hud } from './components/Hud'
import { Menu } from './components/Menu'
import type { DrawMode } from './engine/cards'
import type { PileRef } from './engine/board'
import { foundationIndex } from './engine/cards'
import { loadHighContrast, saveHighContrast } from './preferences'
import {
  applyAutoFoundationMove,
  applyHint,
  autoFoundation,
  canAutoComplete,
  cardForAutoMove,
  clickStock,
  createGame,
  deckIsClear,
  dropCards,
  newDeal,
  nextAutoFoundationMove,
  tick,
  undo,
  type GameState,
} from './engine/game'

type Screen = 'menu' | 'play'

const ANIM_MS = 380
const SHUFFLE_MS = 580
const FLY_MS = 320
const AUTO_GAP_MS = 70

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [state, setState] = useState<GameState | null>(null)
  const [highContrast, setHighContrast] = useState(loadHighContrast)
  const [animDrawIds, setAnimDrawIds] = useState<ReadonlySet<string>>(() => new Set())
  const [animPlaceIds, setAnimPlaceIds] = useState<ReadonlySet<string>>(() => new Set())
  const [shuffling, setShuffling] = useState(false)
  const [fly, setFly] = useState<FlyAnim | null>(null)
  const [autoCompleting, setAutoCompleting] = useState(false)
  const prevStatus = useRef<GameState['status'] | null>(null)
  const animTimers = useRef<number[]>([])
  const shuffleLock = useRef(false)
  const autoLock = useRef(false)
  const stateRef = useRef<GameState | null>(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast)
    saveHighContrast(highContrast)
  }, [highContrast])

  const onToggleContrast = useCallback(() => {
    playUiClick()
    setHighContrast((v) => !v)
  }, [])

  const clearAnimTimers = useCallback(() => {
    for (const id of animTimers.current) window.clearTimeout(id)
    animTimers.current = []
  }, [])

  const pulseDraw = useCallback((ids: string[]) => {
    setAnimDrawIds(new Set(ids))
    const timer = window.setTimeout(() => setAnimDrawIds(new Set()), ANIM_MS)
    animTimers.current.push(timer)
  }, [])

  const pulsePlace = useCallback((ids: string[]) => {
    setAnimPlaceIds(new Set(ids))
    const timer = window.setTimeout(() => setAnimPlaceIds(new Set()), ANIM_MS)
    animTimers.current.push(timer)
  }, [])

  const resetFx = useCallback(() => {
    clearAnimTimers()
    setAnimDrawIds(new Set())
    setAnimPlaceIds(new Set())
    setShuffling(false)
    setFly(null)
    setAutoCompleting(false)
    shuffleLock.current = false
    autoLock.current = false
  }, [clearAnimTimers])

  const start = useCallback((drawMode: DrawMode) => {
    playUiClick()
    resetFx()
    setState(createGame(drawMode))
    setScreen('play')
  }, [resetFx])

  const onNewDeal = useCallback(() => {
    playUiClick()
    resetFx()
    setState((s) => (s ? newDeal(s) : s))
  }, [resetFx])

  const toMenu = useCallback(() => {
    playUiClick()
    resetFx()
    setScreen('menu')
    setState(null)
  }, [resetFx])

  const onUndo = useCallback(() => {
    if (shuffleLock.current || autoLock.current) return
    playUiClick()
    setAnimDrawIds(new Set())
    setAnimPlaceIds(new Set())
    setState((s) => (s ? undo(s) : s))
  }, [])

  const onHint = useCallback(() => {
    if (autoLock.current) return
    playUiClick()
    setState((s) => (s ? applyHint(s) : s))
  }, [])

  const onDrawStock = useCallback(() => {
    if (shuffleLock.current || autoLock.current) return

    setState((s) => {
      if (!s) return s

      if (s.board.stock.length === 0 && s.board.waste.length > 0) {
        shuffleLock.current = true
        setShuffling(true)
        playShuffle()
        const timer = window.setTimeout(() => {
          setState((prev) => (prev ? clickStock(prev) : prev))
          setShuffling(false)
          shuffleLock.current = false
        }, SHUFFLE_MS)
        animTimers.current.push(timer)
        return s
      }

      const beforeWaste = new Set(s.board.waste.map((c) => c.id))
      const next = clickStock(s)
      if (next === s || next.moves <= s.moves) return s

      playDraw()
      const drawn = next.board.waste
        .filter((c) => !beforeWaste.has(c.id))
        .map((c) => c.id)
      if (drawn.length > 0) pulseDraw(drawn)
      return next
    })
  }, [pulseDraw])

  const onDrop = useCallback(
    (from: PileRef, to: PileRef): boolean => {
      if (autoLock.current) return false
      let moved = false
      setState((s) => {
        if (!s) return s
        const next = dropCards(s, from, to)
        if (next.moves <= s.moves) return { ...s, selected: null }

        moved = true
        const founded =
          next.board.foundations.reduce((n, f) => n + f.length, 0) >
          s.board.foundations.reduce((n, f) => n + f.length, 0)
        if (founded) playFoundation()
        else playCardPlace()

        pulsePlace(placedCardIds(s, next, to))
        return next
      })
      return moved
    },
    [pulsePlace],
  )

  const onAutoFoundation = useCallback(
    (ref: PileRef) => {
      if (autoLock.current) return
      setState((s) => {
        if (!s) return s
        const next = autoFoundation(s, ref)
        if (next === s || next.moves <= s.moves) return s
        playFoundation()
        for (let i = 0; i < 4; i++) {
          if (next.board.foundations[i].length > s.board.foundations[i].length) {
            const top = next.board.foundations[i].at(-1)
            if (top) pulsePlace([top.id])
            return next
          }
        }
        return next
      })
    },
    [pulsePlace],
  )

  const runAutoCompleteStepRef = useRef<() => void>(() => {})

  useEffect(() => {
    runAutoCompleteStepRef.current = () => {
      const current = stateRef.current
      if (!current || current.status !== 'playing') {
        autoLock.current = false
        setAutoCompleting(false)
        return
      }

      const move = nextAutoFoundationMove(current.board)
      if (!move) {
        autoLock.current = false
        setAutoCompleting(false)
        return
      }

      const card = cardForAutoMove(current.board, move)
      if (!card) {
        autoLock.current = false
        setAutoCompleting(false)
        return
      }

      const fromHost = document.querySelector(
        `[data-card-id="${CSS.escape(card.id)}"]`,
      ) as HTMLElement | null
      const foundation = foundationIndex(card.suit)
      const toHost = document.querySelector(
        `[data-drop="foundation:${foundation}"]`,
      ) as HTMLElement | null

      // Measure the actual .card face — hosts (tableau wrappers) are column-wide
      // and would stretch the fly animation.
      const fromEl = cardFaceEl(fromHost)
      const toEl = cardFaceEl(toHost) ?? toHost
      const fromRect = fromEl?.getBoundingClientRect()
      const toRect = toEl?.getBoundingClientRect()

      if (fromRect && toRect) {
        const w = fromRect.width
        const h = fromRect.height
        setFly({
          card,
          from: { x: fromRect.left, y: fromRect.top, w, h },
          to: {
            x: toRect.left + (toRect.width - w) / 2,
            y: toRect.top + (toRect.height - h) / 2,
            w,
            h,
          },
        })
      }

      const land = window.setTimeout(() => {
        playFoundation()
        const next = applyAutoFoundationMove(current, move)
        stateRef.current = next
        setState(next)
        setFly(null)
        pulsePlace([card.id])

        if (next.status === 'won') {
          autoLock.current = false
          setAutoCompleting(false)
          return
        }

        const nextTick = window.setTimeout(
          () => runAutoCompleteStepRef.current(),
          AUTO_GAP_MS,
        )
        animTimers.current.push(nextTick)
      }, FLY_MS)
      animTimers.current.push(land)
    }
  }, [pulsePlace])

  // Kick off auto-complete when deck is empty and finish is foundation-only.
  useEffect(() => {
    if (screen !== 'play' || !state) return
    if (state.status !== 'playing') return
    if (shuffling || shuffleLock.current || autoLock.current) return
    if (!deckIsClear(state.board)) return
    if (!canAutoComplete(state.board)) return

    autoLock.current = true
    const startTimer = window.setTimeout(() => {
      setAutoCompleting(true)
      runAutoCompleteStepRef.current()
    }, 280)
    animTimers.current.push(startTimer)
  }, [screen, state, shuffling])

  useEffect(() => () => clearAnimTimers(), [clearAnimTimers])

  useEffect(() => {
    if (screen !== 'play') return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        onUndo()
        return
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === 'h' || event.key === 'H') {
        event.preventDefault()
        onHint()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [screen, onHint, onUndo])

  useEffect(() => {
    if (screen !== 'play') return
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const delta = now - last
      last = now
      setState((prev) => {
        if (!prev || prev.status !== 'playing') return prev
        return tick(prev, delta)
      })
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [screen])

  useEffect(() => {
    if (!state) {
      prevStatus.current = null
      return
    }
    if (prevStatus.current === 'playing' && state.status === 'won') {
      playWin()
    }
    prevStatus.current = state.status
  }, [state])

  if (screen === 'menu' || !state) {
    return (
      <div className="app">
        <Menu
          onStart={start}
          highContrast={highContrast}
          onToggleContrast={onToggleContrast}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <div className={`play${autoCompleting ? ' auto-completing' : ''}`}>
        <Hud
          state={state}
          highContrast={highContrast}
          onToggleContrast={onToggleContrast}
          onUndo={onUndo}
          onHint={onHint}
          onNewGame={onNewDeal}
          onChangeMode={toMenu}
        />
        <Board
          state={state}
          onDrawStock={onDrawStock}
          onDrop={onDrop}
          onAutoFoundation={onAutoFoundation}
          animDrawIds={animDrawIds}
          animPlaceIds={animPlaceIds}
          shuffling={shuffling}
          fly={fly}
          inputLocked={autoCompleting || shuffling}
        />
        <GameOverModal
          state={state}
          onNewGame={onNewDeal}
          onChangeMode={toMenu}
        />
      </div>
    </div>
  )
}

function cardFaceEl(host: HTMLElement | null): HTMLElement | null {
  if (!host) return null
  if (host.classList.contains('card') && !host.classList.contains('card-slot')) {
    return host
  }
  return host.querySelector('.card:not(.card-slot)')
}

function placedCardIds(
  before: GameState,
  after: GameState,
  to: PileRef,
): string[] {
  if (to.type === 'tableau') {
    const prev = new Set(before.board.tableau[to.col].map((c) => c.id))
    return after.board.tableau[to.col]
      .filter((c) => !prev.has(c.id))
      .map((c) => c.id)
  }
  if (to.type === 'foundation') {
    const prev = new Set(before.board.foundations[to.index].map((c) => c.id))
    return after.board.foundations[to.index]
      .filter((c) => !prev.has(c.id))
      .map((c) => c.id)
  }
  return []
}
