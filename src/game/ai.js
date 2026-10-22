import { ITEMS, canUseItem, canPass, oddsDenom } from './logic.js';

/**
 * HOUSE brain for the aim duel.
 *
 * A blank on yourself keeps the revolver, and every blank raises the odds
 * on the next chamber, so the play is: test your own nerve while the odds
 * are long, then turn the gun across the table once they get short.
 *
 *   known blank → shoot self (free turn)      known live → shoot you
 *   1 in 3 or worse → shoot you               1 in 4 → mostly shoot you
 *   1 in 5 / 1 in 6 → mostly self, sometimes you, rarely pass
 *
 * Chip logic (scope / rack / stun) still runs if a variant deals chips.
 * `rng` is injectable so tests are deterministic.
 */
export function decideAi(state, rng = Math.random) {
  if (state.mode !== 'ai' || !state.aiTurn || state.over || !state.spun) {
    return { type: 'wait' };
  }
  const has = (item) => state.aiItems.includes(item);
  const liveKnown = state.peek === 'live';
  const blankKnown = state.peek === 'blank';
  const denom = oddsDenom(state);
  const shoot = (target) => ({ type: 'pull', target });

  if (liveKnown) return shoot('other');
  if (blankKnown) return shoot('self');
  if (has(ITEMS.scope) && denom <= 3 && canUseItem(state, 'ai')) {
    return { type: 'item', item: ITEMS.scope };
  }
  if (has(ITEMS.stun) && denom <= 2 && canUseItem(state, 'ai')) {
    return { type: 'item', item: ITEMS.stun };
  }
  if (denom <= 3) return shoot('other');
  const roll = rng();
  if (denom === 4) return shoot(roll < 0.65 ? 'other' : 'self');
  if (canPass(state, 'ai') && roll < 0.1) return { type: 'pass' };
  return shoot(roll < 0.35 ? 'other' : 'self');
}
