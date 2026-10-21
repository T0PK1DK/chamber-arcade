import { ITEMS, canUseItem, oddsDenom } from './logic.js';

/**
 * HOUSE brain. Conservative: peek when the drum is getting short,
 * eject a known live, stun when odds are ugly, otherwise pull.
 */
export function decideAi(state) {
  if (state.mode !== 'ai' || !state.aiTurn || state.over || !state.spun) {
    return { type: 'wait' };
  }
  const has = (item) => state.aiItems.includes(item);
  const liveKnown = state.peek === 'live';
  const blankKnown = state.peek === 'blank';
  const denom = oddsDenom(state);

  if (liveKnown && has(ITEMS.rack) && canUseItem(state, 'ai')) {
    return { type: 'item', item: ITEMS.rack };
  }
  if (!state.peek && has(ITEMS.scope) && denom <= 3 && canUseItem(state, 'ai')) {
    return { type: 'item', item: ITEMS.scope };
  }
  if (blankKnown) return { type: 'pull' };
  if (has(ITEMS.stun) && denom <= 2 && canUseItem(state, 'ai')) {
    return { type: 'item', item: ITEMS.stun };
  }
  return { type: 'pull' };
}
