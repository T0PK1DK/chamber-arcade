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

## Polish pass (lighting, juice, touch)

Played Fair / Classic / VS HOUSE at 390×844 and 1280×800 (local `vite preview`; the live site is still 2D).

- **Fixed**: portrait camera cropped HOUSE (aspect-aware framing in `src/scene/framing.js`); hole wells were buried inside the sleeves so current / live chambers never showed; `cylinder.setIndex(i)` never eased the drum after a safe pull; a round win showed in red.
- **Lighting**: SpotLight lamp pool (one shadow map on desktop, not a point light's six), hemisphere ambient, low-specular brass, dimmer wall CRT, neon rim follows the turn (green you / amber HOUSE / red hit). A zero-intensity hit light is always present so the light count never changes.
- **Juice** (`src/game/feel.js`, Node-tested): trauma² shake, 90 ms hit-stop, drum punch, FOV kick, pooled sparks (`src/scene/sparks.js`, one draw call), screen flash, status pop, streak bump, odds turns amber then red, win jingle, landing clack. Reduced motion keeps only a soft flash.
- **Touch** (`src/game/gesture.js`, Node-tested): tap or swipe the table to spin, press and hold to pull (fill ring). Tap never pulls; nothing pulls on the HOUSE turn. One big morphing thumb button, kit chips are tappable (44 px+), haptics on spin / safe / hit.

## Real Russian roulette pass (owner request)

The owner asked for "a real Russian roulette game … fun for the older crowd". That **replaces** the old "no realistic gun" rule. Research and sources are in `docs/RESEARCH.md` §4.

- **Revolver**: `src/scene/revolver.js` (primitives, no model files) replaces the toy drum (`cylinder.js` deleted). Poses: `table`, `player` (lifts out of frame toward you while the view tunnels in on HOUSE), `house` (muzzle at HOUSE's temple). The hammer cocks before every pull.
- **HOUSE** is a faceless figure in a suit and fedora. The tell is now an amber glint in its eyes. On a hit it slumps onto the table.
- **Rules** (`logic.js`, tested in `tests/stakes.test.js`):
  - Solo modes carry a pot: $100 stake, fair-odds growth, `cashOut()` after at least one safe pull. A hit loses the pot.
  - The duel deals one `respin` per side per round. `useItem(..., 'respin')` re-rolls the load, resets the odds to 1/6 and keeps your turn. HOUSE re-spins at 1 in 3 or worse.
  - SCOPE/RACK/STUN stay in the code and tests but are not dealt.
- **UX for older players**: an 18+ gate (saved), an A+ text toggle (saved), an 18 px base, 56–68 px buttons, a chamber dial, odds in words, How to play, C = cash out, R = re-spin.
- **Hits**: yours is a hard cut to black plus an ear-ring tone. HOUSE's is a muzzle flash, a slump, and the revolver drops. (Blood was added in the next pass, behind the BLOOD toggle.)

## Blood + gun effects pass (owner request)

- `src/scene/fx.js`: muzzle-flash sprite, smoke sprites, pooled blood droplets that stick to the felt or floor, wall and felt spatter decals (CanvasTexture), and a spreading pool. `clear()` runs on every reset.
- `src/game/splatter.js` (pure, tested): spatter layouts plus a 2D painter, shared by the wall decal and the on-screen `#splat` canvas.
- **BLOOD ON/OFF** in the top bar (`chamberGore`, default on). Revolver finish (`chamberFinish`: blued / nickel / gold) on the menu.
- **Hits with blood on:** yours puts blood on the lens, then cuts to black. HOUSE's sprays out the far side, spatters the wall and felt, and pools after it slumps.
- **Limit:** blood only. No wound modelling, dismemberment or head damage.

## Aim duel + people pass (owner request: "real people … pass or shoot or aim at the person")

- **Rules** (`logic.js`, tests in `tests/stakes.test.js`, `tests/ai.test.js`): `pull(state, who, target = 'self')`.
  - Duel `self` blank keeps your turn. `other` blank passes it. A hit loses the round for whoever was aimed at (`result.victim`).
  - `pass(state, who)` works once per side per round (`state.passes`).
  - The duel deals no chips now. Solo modes ignore `target`.
- **HOUSE AI** (`ai.js`, injectable rng):
  - Known chamber: decides the aim.
  - 1 in 3 or worse: shoots you. 1 in 4: mostly shoots you.
  - Long odds: mostly shoots itself, sometimes you, rarely passes.
  - Each of the six seats now has an aggression / caution / tell profile. That bends self-vs-other, pass timing, and peek frequency around the table above. THE STRANGER is the unmodified HOUSE midpoint.
- **People** (`src/game/characters.js`, tested): six looks with table nicknames only (THE BANKER, THE CAPTAIN, THE WIDOW, THE GAMBLER, THE STRANGER, THE PROFESSOR). `dealer.js` builds a primitive human (face, hair, facial hair, glasses, hat, suit, two-joint arms) and `setLook()` swaps it each match.
- **Poses** (`revolver.js`): `aimHouse` (first person, scaled, raised on portrait) and `atPlayer` (in their hand, barrel at the camera). `dealer.setAim('temple' | 'you')`. Moods: `'out'` (slumps after their own shot) and `'shot'` (knocked back when you hit them).
- **HUD**: SHOOT [NAME] (`O`), SHOOT YOURSELF (`Space`, or hold the table), PASS (`P`). Status text swaps HOUSE for the opponent's nickname.

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
src/game/feel.js           Shake / hit-stop / punch envelopes
src/game/gesture.js        Table tap / swipe / hold routing
src/scene/world.js         Renderer, room, lights (lazy)
src/scene/revolver.js      Revolver, poses, hammer, cylinder spin
src/scene/dealer.js        Opponent person (cast looks), aim, slump / knock-back, eye-glint tell
src/game/characters.js     The six opponents (nicknames only)
src/scene/kits.js          3D chip tokens
src/scene/geometries.js    Shared buffers
src/scene/quality.js       Mobile / adaptive DPR / reduced motion
src/scene/framing.js       Camera per aspect ratio
src/scene/sparks.js        Pooled spark Points
src/scene/fx.js            Muzzle flash, smoke, blood spray / spatter / pool
src/game/splatter.js       Spatter layout + 2D painter (Node-tested)
src/ui/hud.js              Menu + actions + live status
tests/*.test.js
docs/RESEARCH.md
docs/HANDOFF.md            Original 3D-rewrite note
docs/HANDOFF_3D.md         This file
public/_headers            Pages cache (not a deploy)
```

`window.__chamber` debug hook: `state`, `ready`, `world`, `start`, `spin`, `pull`, `cash`.

## Rules that must not regress

- Fair always 1/6 and re-spins after a safe pull.
- Classic / VS HOUSE share one load; chamber advances; odds = 1/(6 − pulls).
- VS HOUSE is best of 3; first hit loses the round; `survived` counts **player** pulls only.
- Duel: `pull(..., 'self')` blank keeps the turn, `'other'` blank passes it, `pass()` once per side per round. RE-SPIN / SCOPE / RACK / STUN remain in logic (RACK of the live chamber still empties the drum) but are not dealt.
- Solo pot pays fair odds (One Spin: 6/(6 − n) × $100). Cash out needs ≥ 1 safe pull. A hit zeroes the pot.
- `pull(state, 'player')` is a no-op on the house turn. Space must never resolve as `'pull'` while `aiTurn`.
- `state.tell` is true only after HOUSE scopes a live chamber; spin / pull / rack / nextRound clear it.
- Realistic revolver and blood are owner-approved. Blood stays behind the BLOOD toggle; no wound modelling or dismemberment. Keep the 18+ gate, play money only, and no personal names in public text.
- Static host: `npm test && npm run build` writes `dist/`. **Do not deploy** unless the owner says so.

## What is next

1. **Real multiplayer** (WebRTC or a tiny Workers Durable Object). HUD + table kits already show both sides.
2. **One more Fair/Classic chip** if those modes feel thin (a solo peek that costs the streak if live). Do not paste Buckshot item names.
3. **GLB HOUSE** only if it stays < ~100 KB and still cartoon. Primitives are the right default.
4. **Pages deploy** — owner runs Cloudflare with `npm run build` / `dist`. This branch does not flip the live 2D site.
5. **A11y shipped:** skip-to-menu / skip-to-table, a single live region for turn / chambers / odds / pot / result (`src/game/announce.js`), HUD contrast locked in `tests/contrast.test.js`, focus rings on every control.

## Prompt for the next Claude

Paste as-is:

```
You are continuing CHAMBER (Vite + Three.js, noir Russian roulette for adults, non-graphic).

Read docs/RESEARCH.md, docs/HANDOFF_3D.md, docs/HANDOFF.md, README.md, then src/game/logic.js, src/game/input.js, and src/main.js.

This is an add-on codebase. Do not rewrite the table, replace Three.js, or merge the game into one file. Prefer a new module + a Node test over editing five scene files.

Rules that must not regress:
- Fair always 1/6 and re-spins after a safe pull.
- Classic / VS HOUSE share one load; chamber advances; odds = 1/(6-pulls).
- VS HOUSE is best of 3; first hit loses the round; survived counts player pulls only.
- Duel: `pull(..., 'self')` blank keeps the turn, `'other'` blank passes it, `pass()` once per side per round. RE-SPIN / SCOPE / RACK / STUN remain in logic (RACK of the live chamber still empties the drum) but are not dealt.
- Solo pot pays fair odds (One Spin: 6/(6 − n) × $100). Cash out needs ≥ 1 safe pull. A hit zeroes the pot.
- pull(state, 'player') must fail on the house turn. spaceAction(state) must return 'none' while HOUSE is thinking.
- state.tell is HOUSE-only (they scoped a live chamber). Player SCOPE must not set it.
- src/main.js must keep the dynamic import of src/scene/world.js. Game + HUD files stay Three-free.
- Realistic revolver and blood are owner-approved. Blood stays behind the BLOOD toggle; no wound modelling or dismemberment. Keep the 18+ gate, play money only, and no personal names in public text.
- Keep it static: npm test && npm run build writes dist/.
- Do not deploy to chamber-arcade.pages.dev unless the owner explicitly says to. The live site is still the old 2D build.

Do not copy Buckshot Roulette or Roblox assets. Prefer a longer optimization (draw calls, test coverage, a11y) over a flashy texture.

If you add a feature, add a Node test in tests/ and verify Fair, Classic, and VS HOUSE in a phone-width viewport. Run npm test && npm run build before you open the PR. Put a changelog in the PR body.
```
