import { canPull, canSpin } from './logic.js';

/**
 * Keyboard routing kept out of the DOM loop so Space cannot
 * fire HOUSE's chamber. Node-tested.
 */

export function modeFromMenuKey(key) {
  if (key === '1') return 'fair';
  if (key === '2') return 'classic';
  if (key === '3') return 'ai';
  return null;
}

export function spaceAction(state) {
  if (!state) return 'none';
  if (state.over && state.mode === 'ai' && !state.matchOver) return 'next';
  if (state.over) return 'again';
  if (canSpin(state)) return 'spin';
  if (canPull(state, 'player')) return 'pull';
  return 'none';
}

export function itemFromDigit(state, key) {
  const n = Number(key);
  if (!state || !Number.isInteger(n) || n < 1) return null;
  return state.playerItems[n - 1] || null;
}

export function isMuteKey(code) {
  return code === 'KeyM';
}

export function isMenuKey(code) {
  return code === 'Escape';
}

export function isPrimaryKey(code) {
  return code === 'Space' || code === 'Enter';
}
