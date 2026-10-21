# CHAMBER — Russian Roulette

A noir **3D** Russian roulette table for adults (18+). One revolver, six chambers, one round. Push your luck for a growing pot and cash out in time, or sit across from HOUSE for a best-of-three duel.

**18+. Guns, blood and violence; play money only.** Blood can be switched off with the BLOOD button.

Live (previous 2D build): [chamber-arcade.pages.dev](https://chamber-arcade.pages.dev)

## Modes

- **ONE SPIN** (`classic`): spin once, keep pulling. Odds go 1/6 → 1/5 → … → 1/1. The $100 stake grows at fair odds ($120, $150, $200, $300, $600). **Cash out** any time after your first click.
- **SPIN EVERY PULL** (`fair`): the cylinder is re-spun every pull, so it's always 1 in 6. The pot grows ×1.2 per click.
- **DUEL THE HOUSE** (`ai`): pass the revolver, first hit loses the round, best of 3. Each side gets one **RE-SPIN** per round, which resets the odds to 1 in 6 before your pull.

## Features

- Three.js backroom: lamp pool on green baize, primitive-built revolver, HOUSE in a suit and fedora
- The ritual: revolver to the temple, hammer back, heartbeat, then a dry click or a hard cut to black
- Muzzle flash, smoke, recoil, blood spray, spatter and pooling (toggleable); blued / nickel / gold revolver
- Best cash-out per mode and duel win–loss saved locally; 18+ gate; **A+** larger-text toggle
- Shared `AudioContext`, mute (saved), keyboard (Space / Enter, C cash out, R re-spin, Esc, M, 1–3)
- Phone-first HUD, capped pixel ratio, adaptive quality if the frame rate dips
- Deferred Three.js boot, shared geometries, HOUSE visor tell, 3D kit tokens
- Phone: swipe the table to spin, press and hold to pull (Space and touch can never pull for HOUSE)

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
