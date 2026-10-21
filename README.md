# CHAMBER // ARCADE

A CRT-green **3D** table game. Spin a toy six-chamber drum, keep a streak, or sit across from HOUSE for a best-of-three.

**Fair. Fun. No real risk.** Cartoon only — no gore, no realistic firearms.

Live (previous 2D build): [chamber-arcade.pages.dev](https://chamber-arcade.pages.dev)

## Modes

- **FAIR** — Drum re-spins every pull. Always exactly 1/6. Score is your safe streak.
- **CLASSIC** — One load. The chamber advances. Odds rise 1/6 → 1/1.
- **VS HOUSE** — Shared drum, turns alternate, first hit loses the round. Best of 3. Arcade chips: **SCOPE** (peek), **RACK** (eject), **STUN** (skip their next pull). Both kits stay visible.

## Features

- Three.js table, hanging lamp, visible 6-hole drum, seated HOUSE robot
- Tension: camera ease-in, drum tick, phosphor flash, CRT scanlines
- Local best streaks (Fair / Classic) and VS HOUSE win–loss
- Shared `AudioContext`, mute (saved), keyboard (Space / Enter, Esc, M, 1–3)
- Phone-first HUD, capped pixel ratio, adaptive quality if the frame rate dips
- Deferred Three.js boot, shared geometries, HOUSE visor tell, 3D kit tokens
- Keyboard: 1/2/3 modes, Space/Enter play, Esc menu, M mute (Space cannot pull for HOUSE)

Research behind the 3D pass (and what was *not* copied): [docs/RESEARCH.md](docs/RESEARCH.md).  
Handoff for the next agent: [docs/HANDOFF_3D.md](docs/HANDOFF_3D.md).

## Run locally

Needs Node 20+.

```bash
npm install
npm test
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Build (static files)

```bash
npm run build
```

Deploy the **`dist/`** folder. It is a static site (`index.html` + hashed assets). No server API.

Preview the production bundle:

```bash
npm run preview
```

### Cloudflare Pages

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `20` |

Do not upload `node_modules`. The old single-file `index.html` at repo root is now the Vite entry; Pages must run the build.

## Controls

| Input | Action |
| --- | --- |
| **SPIN** | Load the drum |
| **PULL** | Advance the current chamber |
| **SCOPE / RACK / STUN** | Use a chip (VS HOUSE) |
| Space / Enter | Spin, pull, next round, or play again (never HOUSE’s pull) |
| 1 / 2 / 3 | Fair / Classic / VS HOUSE from the menu |
| Esc | Menu |
| M | Mute |

## Disclaimer

Simulation only. Toy drum. No real firearms. For entertainment.
