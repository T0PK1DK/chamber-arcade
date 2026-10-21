# Handoff

Overnight add-on pass (bugs, load/frame, polish, tests) is recorded in **[HANDOFF_3D.md](HANDOFF_3D.md)** — that file has the ready-to-paste Claude prompt.

## What shipped

Chamber Arcade is no longer a single 2D `index.html`. It is a Vite + Three.js static app.

- **Research** in [RESEARCH.md](RESEARCH.md): original *Buckshot Roulette*, Roblox table games (BUCKSHOT, Shotgun Roulette, BUCKSHOT FRENZY, Untitled Buckshot), and an explicit borrow list. No third-party code or assets.
- **3D table**: dark room, neon-rim table, hanging lamp, toy 6-hole drum you can read from the seat, HOUSE robot with a CRT visor.
- **Modes kept**: Fair (always 1/6), Classic (odds rise), VS HOUSE (shared drum, best of 3).
- **Borrowed verbs, original names**: SCOPE / RACK / STUN. Visible kits. Tension camera + phosphor FX. Still cartoon, non-graphic.
- **Bugs fixed** (from the first live build):
  - Game-over SPIN was a no-op → **PLAY AGAIN** / **NEXT ROUND**.
  - VS AI re-spun and re-rolled the live chamber on the house turn → one load, chamber advances.
  - Survival score counted AI clicks → player-only.
  - New `AudioContext` per sound → one context + mute.
  - No per-mode bests / AI record / keyboard → added (and migrated the old `chamberBest` key).
- **Perf**: no font CDN, no textures, shared materials, DPR cap, no shadows on phones, adaptive drop if FPS < 28, pause while the tab is hidden, Three.js in its own chunk.
- **Build**: `npm test && npm run build` → `dist/`. CI in `.github/workflows/build.yml`.

## Layout

```
index.html                 Vite entry (overlay + canvas)
src/main.js                Loop, input, AI timing
src/game/logic.js          Pure rules (Node-tested)
src/game/ai.js             HOUSE decisions
src/game/audio.js          WebAudio tones
src/game/storage.js        localStorage
src/scene/world.js         Renderer, room, lights
src/scene/cylinder.js      Drum + hole highlight
src/scene/dealer.js        HOUSE rig
src/scene/quality.js       Mobile / adaptive DPR
src/ui/hud.js              Menu + actions
tests/logic.test.js
docs/RESEARCH.md
docs/HANDOFF.md
```

`window.__chamber` is a tiny debug hook (`state`, `start`, `spin`, `pull`).

## What is next

1. **Real multiplayer** (WebRTC or a tiny Workers Durable Object) — the HUD already shows both kits.
2. **One more chip** if Fair/Classic feel thin (a solo SCOPE that costs the streak if you peek). Do not paste Buckshot item names.
3. **HOUSE tells**: visor flicker when the house knows the chamber is live.
4. **GLB HOUSE** only if it stays < ~100 KB and still cartoon. Primitives are the right default.
5. **Pages deploy** — owner runs Cloudflare with `npm run build` / `dist`. This branch does not deploy.
6. **A11y**: more than the current button labels (live region for status).

## Prompt for the next Claude

```
You are continuing Chamber Arcade (Vite + Three.js, CRT green, cartoon, non-graphic).

Read docs/RESEARCH.md, docs/HANDOFF.md, README.md, then src/game/logic.js and src/main.js.

Rules that must not regress:
- Fair always 1/6 and re-spins after a safe pull.
- Classic / VS HOUSE share one load; chamber advances; odds = 1/(6-pulls).
- VS HOUSE is best of 3; first hit loses the round; survived counts player pulls only.
- SCOPE / RACK / STUN are original names. RACK of the live chamber empties the drum (must spin again).
- No realistic gun, no gore, no personal names in public text.
- Keep it static: npm test && npm run build writes dist/.

Do not copy Buckshot Roulette or Roblox assets. Prefer a longer optimization (DPR, draw calls, test coverage) over a flashy texture.

If you add a feature, add a Node test in tests/ and verify Fair, Classic, and VS HOUSE in a phone-width viewport.
```
