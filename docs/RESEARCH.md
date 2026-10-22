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

---

## 4. "Make it real Russian roulette" pass (owner request, 2026-10-21)

The owner asked for a real Russian roulette game, fun for an older (adult) crowd. This pass drops the toy-drum arcade framing for a realistic revolver and a noir backroom, but keeps **no gore** and adds an **18+ gate**.

### The real thing, as a game

- Russian roulette has a literary origin, not a documented military one. Lermontov's *A Hero of Our Time* (1840, "The Fatalist") has an officer test fate with a pistol to his own head. The name comes from Georges Surdez's story "Russian Roulette" in *Collier's* (30 January 1937). The earliest newspaper death reports date from 1938. ([Wikipedia](https://en.wikipedia.org/wiki/Russian_roulette), [Swiss National Museum blog](https://blog.nationalmuseum.ch/en/2025/01/invention-of-russian-roulette/), [Straight Dope](https://www.straightdope.com/21342497/did-the-russians-ever-play-russian-roulette), [Today I Found Out](https://www.todayifoundout.com/index.php/2020/10/who-invented-russian-roulette-and-has-anyone-ever-actually-played-it/))
- Two real variants map onto the existing modes. **Spin every pull** is always 1 in 6 (FAIR). **One spin** keeps pulling, so the odds go 1/6 → 1/5 → … → 1/1 (CLASSIC). A **re-spin before your pull** is the classic house rule that gives a two-player duel a real decision. It replaces the arcade chips.

### Why adults find these games fun

- **Liar's Bar** (2024) put Russian roulette at the end of a bluffing card game. Its revolver is "1 lethal + 5 blanks", so every survived pull raises the odds. Reviews credit the tension of reading the opponent, then handing the outcome to pure luck. It passed 110k concurrent players at launch. ([Wikipedia](https://en.wikipedia.org/wiki/Liar%27s_Bar), [Steam](https://store.steampowered.com/app/3097560/Liars_Bar/), [rules write-up](https://debigare.com/how-to-play-liars-deck-from-liars-bar-full-rules-and-variants), [PCGamesN](https://www.pcgamesn.com/liars-bar/early-access-launch))
- **Push-your-luck** is the strongest adult hook for a solo game. The only real choice is *stop and keep it, or risk it all for more*, and the tension builds as the stakes grow. Zombie Dice and crash-style games are the purest examples. ([co-optimus](https://www.co-optimus.com/blog/article-poster/3326/risk-timing-and-nerve-the-game-mechanics-that-test-when-to-cash-out.html), [I Slay the Dragon](https://islaythedragon.com/guides/a-guide-to-pressing-your-luck))
  - **What we built:** a $100 stake that grows at **fair odds** on every safe pull. In One Spin that's 6/(6 − n) × stake: $120, $150, $200, $300, $600. There's a **Cash out** button. No house edge, so the only variable is nerve. A unit test proves the expected value of one more pull equals what you hold.
- Buckshot Roulette (section 1) showed that a dim table, a seated opponent and one sound-led moment are the whole fantasy. We still borrow none of its names or items.

### Designing for older eyes and hands

- A systematic review found older adults prefer larger type, up to a point. Practitioner guides converge on 16 px+ body text, a user-adjustable size, high contrast (WCAG AA 4.5:1, ideally 7:1), touch targets well above 44 px with spacing between them, text labels on controls, and clear tap feedback. ([PMC systematic review](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9376262/), [arXiv touchscreen guideline review](https://arxiv.org/pdf/1703.06317), [UX Collective checklist](https://uxdesign.cc/designing-for-older-audiences-checklist-best-practices-b6ca3ec5bcbf), [UX Collective guide](https://uxdesign.cc/a-guide-to-interface-design-for-older-adults-31109468d46d), [50+ game design guide](https://wikidocs.net/155867))
  - **What we built:** an 18 px base with an **A+** toggle (~21 px, saved). Cream on near-black, well above 7:1. 56–68 px buttons. Plain-language buttons ("PULL THE TRIGGER", "CASH OUT $150"). Odds in words ("1 IN 4 IS LIVE"). A six-pip cylinder dial. A How to play section on the menu.

### Blood pass (owner request, same day)

The owner asked for real gore, guns and effects for the 18+ audience, pointing to Roblox games in the same lane. We added **M-rated game blood** with a player toggle:

- **HOUSE takes the round:** muzzle flash, barrel smoke, a blood spray out the far side of the head, spatter on the wall and felt, and a pool that spreads under it after it slumps.
- **You take the round:** blood hits the lens, then the screen cuts to black with a ringing ear.
- **BLOOD ON/OFF** button (default on, saved). With it off you get the earlier clean version.
- **Guns:** a choice of three revolver finishes (blued, nickel, gold), harder recoil, and a layered gunshot with two room echoes.

**Deliberate limit:** no wound modelling, dismemberment or head damage. Blood effects carry the moment without a detailed depiction of a self-inflicted gunshot.

### Lines we kept
- **18+ gate** on first visit, now naming guns, blood and violence, plus a one-line 988 crisis-line note. The theme is self-harm-adjacent, and the note costs nothing.
- **Play money only.** No real-money wagering, no purchases.

### Aim duel (owner request: "pass or shoot or aim at the person like that one Roblox game")

The Roblox BUCKSHOT tables (section 2) and Buckshot Roulette (section 1) both hinge on one rule: **you choose who to shoot, and a blank on yourself keeps your turn.** On a six-shot revolver that creates a real decision:
- Every empty chamber raises the odds on the next one.
- Surviving your own shot keeps the revolver, so your next shot at them comes at shorter odds.
- Shooting them early on long odds usually just hands them a better shot at you.

We kept that verb set (shoot self, shoot opponent, pass once per round) and none of the shotgun games' items, names or assets. The opponent is a rotating cast of six people, built from primitives and identified only by table nicknames.
