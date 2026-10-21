import { canSpin } from './logic.js';
import { spaceAction } from './input.js';

/**
 * Touch on the 3D table. Node-tested so a stray tap can never pull for HOUSE.
 *
 * swipe — flick the drum to spin it (only when a spin is allowed)
 * tap   — spin when the drum is empty; never pulls (too easy to hit by accident)
 * hold  — press and hold on the table to pull, with a fill ring as the tell
 *
 * Next round / play again stay on real buttons so a reflex tap after a hit
 * does not skip the result.
 */

export const TAP_MAX_PX = 14;
export const SWIPE_MIN_PX = 36;
export const SWIPE_MAX_MS = 600;
export const HOLD_MS = 420;

export function classifyGesture({ dx = 0, dy = 0, ms = 0 } = {}) {
  const dist = Math.hypot(dx, dy);
  if (dist >= SWIPE_MIN_PX && ms <= SWIPE_MAX_MS && Math.abs(dx) >= Math.abs(dy) * 0.6) return 'swipe';
  if (dist <= TAP_MAX_PX && ms < HOLD_MS) return 'tap';
  if (dist <= TAP_MAX_PX && ms >= HOLD_MS) return 'hold';
  return 'none';
}

export function tableAction(state, gesture) {
  if (!state) return 'none';
  const act = spaceAction(state);
  if (gesture === 'swipe' || gesture === 'tap') return canSpin(state) ? 'spin' : 'none';
  if (gesture === 'hold') return act === 'pull' ? 'pull' : 'none';
  return 'none';
}

/** Can a hold that starts now end in a pull? Drives the fill ring. */
export function canHoldToPull(state) {
  return Boolean(state) && spaceAction(state) === 'pull';
}
