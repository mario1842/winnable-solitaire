# Winnable Solitaire

Klondike Solitaire in the browser where **every deal is guaranteed solvable**. Draw one or three, build foundations, and clear the board — no dead shuffles.

**Play online:** [https://mario1842.github.io/winnable-solitaire/](https://mario1842.github.io/winnable-solitaire/)  
**Repository:** [https://github.com/mario1842/winnable-solitaire](https://github.com/mario1842/winnable-solitaire)  
Companion to [Winnable Mahjong](https://mario1842.github.io/winnable-mahjong/), [Winnable Minesweeper](https://mario1842.github.io/winnable-minesweeper/), and [Flow of the Elements](https://mario1842.github.io/flow-of-the-elements/).

## Play locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/winnable-solitaire/`).

## Features

- **Guaranteed winnable deals** — verified seed bank + suit isomorphisms (always solvable)
- **Draw One** and **Draw Three** modes (unlimited stock passes)
- Drag-and-drop play, double-click to send a card to the foundation
- Undo, hint (**`H`** key), timer, score, and move count
- Shuffle animation + sound when recycling the waste into the stock
- Auto-complete finale — when the deck is empty and only foundation plays remain, cards fly home and you win
- **High contrast** suit colors (Balatro-style: clubs blue, diamonds orange) — toggle saved in the browser
- Soft card / UI sounds (Web Audio, no audio files)
- Responsive layout for desktop and phone
- Static build — free hosting on GitHub Pages

## Scripts

| Command           | Description                  |
| ----------------- | ---------------------------- |
| `npm run dev`     | Local development server     |
| `npm test`        | Engine unit tests            |
| `npm run build`   | Production build to `dist`   |
| `npm run preview` | Preview the production build |

## Deploy to GitHub Pages

1. Push this repo to GitHub as `winnable-solitaire` (or change `base` in `vite.config.ts` to match your repo name).
2. In the repo **Settings → Pages**, set source to **GitHub Actions**.
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys.

Game URL: `https://mario1842.github.io/winnable-solitaire/`
