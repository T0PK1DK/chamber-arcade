# Chamber Arcade — comparable-game research

This note records what the original *Buckshot Roulette* and several Roblox table games actually do, then lists **which ideas this project borrowed as original implementations**. No code, meshes, audio, names of items, or art from those games were copied.

Tone target for this project: **cartoon arcade, CRT phosphor green, non-graphic**. The chamber is a toy drum on a table, not a realistic firearm. Hits are a neon “OUT” flash, never gore.

---

## 1. Buckshot Roulette (original)

*Buckshot Roulette* is a 2023 indie tabletop horror game by Mike Klubnika (Godot), first on itch.io (28 December 2023) and on Steam via Critical Reflex (4 April 2024). It is a modified Russian-roulette match against a computer-controlled **Dealer**, played with a pump shotgun loaded with a known mix of live shells and blanks in an unknown order. Steam page tagline: “Play Russian roulette with a 12-gauge shotgun. Four enter. One leaves.”

### Structure that makes it tense

- **Three major rounds.** Each round the Dealer loads a visible count of live vs blank shells, then hides the order.
- **Lives / charges.** Defibrillator charges stand in for health (fewer early, more later; round 3 becomes sudden death).
- **Aim choice.** Shoot the Dealer or yourself. A blank on yourself **keeps your turn**.
- **Reload if the tube empties** before someone is out of charges.
- **Items from round 2.** Consumables land on the table for both sides (2 in round 2, 4 in round 3, cap of 8). Items are why the game is strategy, not only luck.
- **Dealer as a character.** A seated opponent with tells, item use, and the same rules as the player.
- **Double or Nothing** endless cash loop after a first win.
- **4-player multiplayer** (Halloween 2024) plus two multiplayer-only items (Jammer, Remote).

### Item verbs (paraphrased — we do not reuse names or assets)

Published guides (IGN, Dot Esports, Steam Community, TheGamer) agree on these verbs:

| Verb | Typical effect |
| --- | --- |
| Peek current | See whether the next shell is live or blank |
| Peek later | Learn type + position of a future shell |
| Eject / rack | Throw away the current shell without firing |
| Skip turn | Opponent loses their next turn |
| Heal | Regain one charge (cannot overheal) |
| Risky heal | Chance of +2 or −1 charge |
| Double damage | Next live hit costs two charges |
| Invert | Flip current shell live ↔ blank |
| Steal | Take an opponent item and use it now |

### Why it works

The load is **partial information** (counts known, order hidden). Items convert luck into a short puzzle. The Dealer sitting across a dim table, plus a 15–20 minute clock, is the whole fantasy.

### Sources

- [Wikipedia: Buckshot Roulette](https://en.wikipedia.org/wiki/Buckshot_Roulette)
- [Steam store page](https://store.steampowered.com/app/2835570/Buckshot_Roulette/)
- [IGN item guide](https://www.ign.com/wikis/buckshot-roulette/All_Items_in_Buckshot_Roulette)
- [Dot Esports item list](https://dotesports.com/indies/news/all-items-in-buckshot-roulette-listed)
- [Steam Community item guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3212406360)
- [TheGamer item guide](https://www.thegamer.com/buckshot-roulette-items-explained-guide/)
- [Fanlore overview](https://fanlore.org/wiki/Buckshot_Roulette)

---

## 2. Roblox table games in the same lane

These experiences translate the same “table, mixed load, items, stare-down” loop into public multiplayer. Descriptions below are from their public Roblox pages (read 2026-10-21). Visit counts move; treat them as order-of-magnitude only.

### BUCKSHOT (place 16154918775)

- [Roblox: BUCKSHOT](https://www.roblox.com/games/16154918775/BUCKSHOT)
- Copy on the page: mixed live/blank shells, take turns, shoot the rival or risk a blank to keep the turn, count spent shells, “lie to their face.”
- **1v1 duels and 4-player tables.**
- **Items called out:** peek, rack one out, handcuff, heal, invert, steal.
- Ranked ladder, skins, trading — the live-service wrapper around the table.
- ~150M+ visits at time of reading; strategy genre; “Mild” violence label.

### Shotgun Roulette (place 16147193679)

- [Roblox: Shotgun Roulette](https://www.roblox.com/games/16147193679/Shotgun-Roulette)
- Markets itself as a tabletop horror redesign of the same loop. Still in beta per the page. Confirms demand for a **shared table + waiting for your turn**.

### BUCKSHOT FRENZY (place 16104162437)

- [Roblox: BUCKSHOT FRENZY](https://www.roblox.com/games/16104162437/BUCKSHOT-FRENZY)
- Explicitly credits the original table game and advertises **mobile + console** support. That is the bar for this web port: fat tap targets, low GPU cost, readable HUD on a phone.

### Untitled Buckshot (place 15943026258)

- [Roblox: Untitled Buckshot](https://www.roblox.com/games/15943026258/Untitled-Buckshot)
- Multiplayer + custom mode. Public disclaimer about loud sounds. Another reminder that **the match fantasy is “high risk, high reward, heart-racing”**, not a stats sim.

### What the Roblox set adds over the single-player original

- Other humans across the table (bluffing, waiting, pile-ons).
- Visible item kits so you plan around what they are holding.
- Phone-first controls.
- Cosmetic / ranked loops we are **not** borrowing.

---

## 3. Other web 3D takes (do not clone)

- [Buckshot Roulette 3D (itch.io, Three.js + GSAP)](https://sizzil.itch.io/buckshot-roulette-3d/devlog/1713635/buckshot-roulette-3d) — a browser 3D table with a large custom item list and cinematic camera. Proof that Three.js can carry this fantasy in a browser. We do not reuse its items, models, or code.
- [GitHub topic: buckshot-roulette](https://github.com/topics/buckshot-roulette) — helpers, CLI clones, a React/Three/Socket.io multiplayer experiment. Useful only as a “this genre is crowded; stay original” warning.

---

## 4. What Chamber Arcade already had

Live at [chamber-arcade.pages.dev](https://chamber-arcade.pages.dev) (`index.html`):

| Mode | Rule |
| --- | --- |
| **Fair** | Re-spin every pull. Always 1/6. Score = safe pulls. |
| **Classic** | One spin, chamber advances, odds 1/6 → 1/1. |
| **VS AI** | Intended as a shared cylinder and alternating pulls. |

Bugs in the first single-file build (fixed in this rewrite):

- Game-over left **SPIN** enabled but `spin()` no-op’d (`if (over) return`), so the table felt stuck.
- VS AI **re-spun and re-rolled the live chamber** on the AI’s turn, so the “odds rise” label was a lie.
- **Survival score counted AI clicks.**
- A new `AudioContext` on every sound (leaks / autoplay pain).
- No play-again, no mute, no per-mode bests, no keyboard path.

Those rules stay. Presentation becomes 3D.

---

## 5. Features we are borrowing (original implementations)

Borrowed means **the verb and the feeling**, not names, art, audio, or code.

| Borrowed idea | How Chamber Arcade does it (original) |
| --- | --- |
| **Items** | Three arcade chips, original names: **SCOPE** (peek current chamber), **RACK** (eject current chamber; if it was live, the drum is empty and must be spun again), **STUN** (opponent skips their next pull). VS AI only. 1 chip in round 1, 2 chips in rounds 2–3. Both kits are visible. |
| **Rounds** | VS AI is **best of 3**. Each round is still “one live chamber, first hit is out.” Fair / Classic stay single-streak arcade. |
| **A dealer character** | Low-poly **HOUSE** robot with a CRT visor, seated across a neon table. Idle breathe, lean on think, nod on a safe click, cartoon shake on OUT. Not a horror portrait. |
| **Tension** | Camera ease-in on PULL, lamp dim, drum tick, phosphor flash, CRT scanlines, HOUSE body language, rising odds readout. Cartoon “OUT” — no blood, no realistic gun. |
| **Multiplayer feel** | Turn banner (YOU / HOUSE), visible HOUSE item chips, HOUSE speech in the status line, best-of-3 match score. Still local vs AI — no network. |

Intentionally **not** borrowed: shotgun vs self-or-opponent aiming, defibrillator lore, invert/steal/heal-risk, Double or Nothing cash, ranked skins, trading, horror gore, any third-party mesh or sample.

---

## 6. Design constraints this research locked in

1. Keep Fair / Classic / VS AI as the three doors on the menu.
2. The cylinder must be **readable in 3D** (six holes you can see from the player seat).
3. Phone-first: one canvas, overlay HUD, pixel-ratio cap, no font CDN, no huge textures.
4. Cartoon + phosphor green. Simulation disclaimer stays on screen.
5. Static hosting (`dist/` after `npm run build`).
