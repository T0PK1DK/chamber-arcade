# Handoff (3D overnight pass)

Chamber Arcade is a Vite + Three.js static table game. This note is the **ready state after the overnight add-on pass** on top of PR #2 (`9c325ae`). The live [pages.dev](https://chamber-arcade.pages.dev) site is still the old 2D `index.html` until the owner deploys `dist/`.

## What this pass added (do not redo)

Add-ons only. The PR #2 table, modes, and chips stayed.

- **Bugs**
  - Space / Enter could fire HOUSE’s chamber during the house turn (the 2D overnight bug, back in the 3D port). Keyboard now uses `src/game/input.js`; `pull(state, who)` rejects the wrong actor.
  - Spin tones used orphan `setTimeout`s. Audio jobs are tracked and hushed on mute / menu / reset.
  - Menu had no keyboard path. `1` Fair, `2` Classic, `3` VS HOUSE, `M` mute.
  - Status was a dead string. It is a live region; focus moves to the next playable control.
  - Phone URL-bar resize ignored `visualViewport`. WebGL context-loss now prevents default and reapplies DPR.
- **Load**
  - HUD paints first. `src/scene/world.js` is a dynamic import. Three is **not** module-preloaded.
  - Inline boot CSS so the first paint is not a blank black tab.
  - Named Three imports, shared geometries, Lambert on phones, no side walls on mobile, two fewer point lights on mobile, `mediump` + `stencil: false`.
  - `public/_headers` (Pages cache for `/assets/*`) — shipping the file is not a deploy.
- **Frame**
  - Adaptive quality also kills scanlines. `prefers-reduced-motion` snaps camera / drum and hides CRT stripes.
  - Camera shake / visor jitter skipped when those values are 0. Reused `Vector3`. Fire-ring pulse is opacity, not extra meshes.
- **Visual**
  - HOUSE visor amber-flickers when **HOUSE** scoped a live chamber (`state.tell`). Player SCOPE does not leak that tell.
  - Lamp cord + sway. 3D kit tokens on the felt. CRT wall screen breathes.
- **Tests**
  - `npm test` covers rules, input, HOUSE brain, storage, quality, and “game JS stays Three-free.”

## Layout

```
index.html                 Vite entry (boot text + overlay + canvas)
src/main.js                Boot, input, AI timing (no Three import)
src/game/logic.js          Pure rules (Node-tested)
src/game/ai.js             HOUSE decisions
src/game/audio.js          WebAudio tones + hush()
src/game/storage.js        localStorage
src/game/input.js          Keyboard routing (Node-tested)
src/game/math.js           shortestAngle
src/scene/world.js         Renderer, room, lights (lazy)
src/scene/cylinder.js      Drum + hole highlight
src/scene/dealer.js        HOUSE rig + tell
src/scene/kits.js          3D chip tokens
src/scene/geometries.js    Shared buffers
src/scene/quality.js       Mobile / adaptive DPR / reduced motion
src/ui/hud.js              Menu + actions + live status
tests/*.test.js
docs/RESEARCH.md
docs/HANDOFF.md            Original 3D-rewrite note
docs/HANDOFF_3D.md         This file
public/_headers            Pages cache (not a deploy)
```

`window.__chamber` debug hook: `state`, `ready`, `start`, `spin`, `pull`.

## Rules that must not regress

- Fair always 1/6 and re-spins after a safe pull.
- Classic / VS HOUSE share one load; chamber advances; odds = 1/(6 − pulls).
- VS HOUSE is best of 3; first hit loses the round; `survived` counts **player** pulls only.
- SCOPE / RACK / STUN are original names. RACK of the live chamber empties the drum (must spin again).
- `pull(state, 'player')` is a no-op on the house turn. Space must never resolve as `'pull'` while `aiTurn`.
- `state.tell` is true only after HOUSE scopes a live chamber; spin / pull / rack / nextRound clear it.
- No realistic gun, no gore, no personal names in public text.
- Static host: `npm test && npm run build` writes `dist/`. **Do not deploy** unless the owner says so.

## What is next

1. **Real multiplayer** (WebRTC or a tiny Workers Durable Object). HUD + table kits already show both sides.
2. **One more Fair/Classic chip** if those modes feel thin (a solo peek that costs the streak if live). Do not paste Buckshot item names.
3. **GLB HOUSE** only if it stays < ~100 KB and still cartoon. Primitives are the right default.
4. **Pages deploy** — owner runs Cloudflare with `npm run build` / `dist`. This branch does not flip the live 2D site.
5. **A11y** beyond the live status + focus move (skip-to-menu, contrast on `.turn.ai`).

## Prompt for the next Claude

Paste as-is:

```
You are continuing Chamber Arcade (Vite + Three.js, CRT green, cartoon, non-graphic).

Read docs/RESEARCH.md, docs/HANDOFF_3D.md, docs/HANDOFF.md, README.md, then src/game/logic.js, src/game/input.js, and src/main.js.

This is an add-on codebase. Do not rewrite the table, replace Three.js, or merge the game into one file. Prefer a new module + a Node test over editing five scene files.

Rules that must not regress:
- Fair always 1/6 and re-spins after a safe pull.
- Classic / VS HOUSE share one load; chamber advances; odds = 1/(6-pulls).
- VS HOUSE is best of 3; first hit loses the round; survived counts player pulls only.
- SCOPE / RACK / STUN are original names. RACK of the live chamber empties the drum (must spin again).
- pull(state, 'player') must fail on the house turn. spaceAction(state) must return 'none' while HOUSE is thinking.
- state.tell is HOUSE-only (they scoped a live chamber). Player SCOPE must not set it.
- src/main.js must keep the dynamic import of src/scene/world.js. Game + HUD files stay Three-free.
- No realistic gun, no gore, no personal names in public text.
- Keep it static: npm test && npm run build writes dist/.
- Do not deploy to chamber-arcade.pages.dev unless the owner explicitly says to. The live site is still the old 2D build.

Do not copy Buckshot Roulette or Roblox assets. Prefer a longer optimization (draw calls, test coverage, a11y) over a flashy texture.

If you add a feature, add a Node test in tests/ and verify Fair, Classic, and VS HOUSE in a phone-width viewport. Run npm test && npm run build before you open the PR. Put a changelog in the PR body.
```
