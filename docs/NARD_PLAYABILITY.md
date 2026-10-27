# Nard — Chamber playability pass (soft launch)

**Claimed:** playability polish on top of Claude's merged duel rewrite (`claude/chamber-arcade-3d-polish-jgqm55` → main via PR #4).

**Not touching:** Claude's table/scene/revolver/dealer/fx architecture, aim-duel rules, cast, blood pass, or 18+ gate.

## This pass owns

1. Clear **YOU WIN / HOUSE WINS / ROUND YOURS** end card + **REMATCH** label after a finished VS AI match.
2. `busy` softlock guard (`syncBusy`) so the player is never button-locked when it is their turn.
3. Re-queue HOUSE AI if the phone tab sleeps mid-turn.
4. Match-end haptic pattern.
5. Node tests that a best-of-3 VS AI match always reaches `matchOver` and rematch resets cleanly.

## Share / deploy

- Public playtest: https://chamber.testdasite.com/ (also https://chamber-arcade.pages.dev/)
- No `kingleonardjr19.workers.dev` links.
