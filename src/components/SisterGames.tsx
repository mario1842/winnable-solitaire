import { FlowIcon } from './FlowIcon'
import { MahjongIcon } from './MahjongIcon'
import { MineIcon } from './MineIcon'

const GAMES = [
  {
    id: 'mahjong',
    href: 'https://mario1842.github.io/winnable-mahjong/',
    title: 'Winnable Mahjong',
    icon: <MahjongIcon className="game-icon" />,
  },
  {
    id: 'minesweeper',
    href: 'https://mario1842.github.io/winnable-minesweeper/',
    title: 'Winnable Minesweeper',
    icon: <MineIcon className="game-icon" />,
  },
  {
    id: 'flow',
    href: 'https://mario1842.github.io/flow-of-the-elements/',
    title: 'Flow of the Elements',
    icon: <FlowIcon className="game-icon" />,
  },
] as const

interface SisterGamesProps {
  /** Larger labeled chips (menu) vs compact icon row (HUD). */
  variant?: 'menu' | 'hud'
}

export function SisterGames({ variant = 'menu' }: SisterGamesProps) {
  return (
    <nav
      className={`sister-games sister-games-${variant}`}
      aria-label="Other games"
    >
      {GAMES.map((game) => (
        <a
          key={game.id}
          className={variant === 'hud' ? 'btn btn-ghost sister-btn icon-btn' : 'sister-link'}
          href={game.href}
          title={game.title}
          aria-label={`Play ${game.title}`}
        >
          {game.icon}
          {variant === 'menu' ? (
            <span>
              Also play <strong>{game.title}</strong>
            </span>
          ) : null}
        </a>
      ))}
    </nav>
  )
}
