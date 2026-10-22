import { ITEMS, canUseItem, canPass, oddsDenom } from './logic.js';
import { resolvePersona } from './characters.js';

/**
 * HOUSE brain for the aim duel.
 *
 * The locked odds table (do not regress):
 *   known blank → shoot self (free turn)      known live → shoot you
 *   1 in 3 or worse → shoot you               1 in 4 → mostly shoot you
 *   1 in 5 / 1 in 6 → mostly self, sometimes you, rarely pass
 *
 * Personality (aggression / caution / tell) only bends the *chances*
 * around that table: how often they aim across on 1/4 and long odds,
 * when they pass, and how early they peek. A missing persona is the
 * HOUSE midpoint (0.5 / 0.5 / 0.5) — same numbers the original tests
 * lock. Chip logic still runs if a variant deals chips.
 *
 * `rng` is injectable so tests are deterministic.
 */

/** Peek when the remaining denom is at or below this. HOUSE default: 3. */
export function scopeThreshold(tell) {
  const t = resolvePersona({ tell }).tell;
  if (t >= 0.85) return 5;
  if (t >= 0.65) return 4;
  if (t >= 0.35) return 3;
  return 2;
}

/** Chance to pass on a long-enough cylinder. HOUSE default: 0.10. */
export function passChance(caution) {
  return resolvePersona({ caution }).caution * 0.2;
}

/** High-caution seats will also pass at 1 in 4. HOUSE default: 5. */
export function passMinDenom(caution) {
  return resolvePersona({ caution }).caution >= 0.7 ? 4 : 5;
}

/**
 * Chance to aim at the other side. denom ≤ 3 is always 1 (HOUSE lock).
 * denom 4 default 0.65; long odds default 0.35.
 */
export function otherChance(aggression, denom) {
  if (denom <= 3) return 1;
  const a = resolvePersona({ aggression }).aggression;
  if (denom === 4) return 0.40 + a * 0.50;
  return 0.15 + a * 0.40;
}

export function decideAi(state, rng = Math.random, persona = state?.persona) {
  if (state.mode !== 'ai' || !state.aiTurn || state.over || !state.spun) {
    return { type: 'wait' };
  }
  const has = (item) => state.aiItems.includes(item);
  const liveKnown = state.peek === 'live';
  const blankKnown = state.peek === 'blank';
  const denom = oddsDenom(state);
  const shoot = (target) => ({ type: 'pull', target });
  const p = resolvePersona(persona);

  if (liveKnown) return shoot('other');
  if (blankKnown) return shoot('self');
  if (has(ITEMS.scope) && denom <= scopeThreshold(p.tell) && canUseItem(state, 'ai')) {
    return { type: 'item', item: ITEMS.scope };
  }
  if (has(ITEMS.stun) && denom <= 2 && canUseItem(state, 'ai')) {
    return { type: 'item', item: ITEMS.stun };
  }
  // Locked: 1 in 3 or worse always comes across the table.
  if (denom <= 3) return shoot('other');

  const roll = rng();
  if (canPass(state, 'ai') && denom >= passMinDenom(p.caution) && roll < passChance(p.caution)) {
    return { type: 'pass' };
  }
  return shoot(roll < otherChance(p.aggression, denom) ? 'other' : 'self');
}
