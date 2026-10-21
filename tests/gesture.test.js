import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, spin, pull } from '../src/game/logic.js';
import {
  classifyGesture,
  tableAction,
  canHoldToPull,
  HOLD_MS,
  SWIPE_MIN_PX,
} from '../src/game/gesture.js';

const at = (index) => (index + 0.1) / 6;
function seq(values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

test('classifyGesture: tap, hold, swipe, and drag-off', () => {
  assert.equal(classifyGesture({ dx: 2, dy: 3, ms: 120 }), 'tap');
  assert.equal(classifyGesture({ dx: 2, dy: 1, ms: HOLD_MS }), 'hold');
  assert.equal(classifyGesture({ dx: SWIPE_MIN_PX + 10, dy: 4, ms: 180 }), 'swipe');
  assert.equal(classifyGesture({ dx: -80, dy: 10, ms: 200 }), 'swipe');
  // A slow drag or a vertical scroll is neither.
  assert.equal(classifyGesture({ dx: 80, dy: 0, ms: 1400 }), 'none');
  assert.equal(classifyGesture({ dx: 4, dy: 90, ms: 200 }), 'none');
  assert.equal(classifyGesture({ dx: 22, dy: 0, ms: 200 }), 'none');
  assert.equal(classifyGesture(), 'tap');
});

test('tap and swipe only spin; they never pull', () => {
  const s = createMatch('classic');
  assert.equal(tableAction(s, 'tap'), 'spin');
  assert.equal(tableAction(s, 'swipe'), 'spin');
  spin(s);
  assert.equal(tableAction(s, 'tap'), 'none');
  assert.equal(tableAction(s, 'swipe'), 'none');
  assert.equal(tableAction(s, 'hold'), 'pull');
});

test('hold cannot pull before a spin, after a hit, or with no state', () => {
  assert.equal(tableAction(null, 'hold'), 'none');
  const s = createMatch('fair', seq([at(2), at(2)]));
  assert.equal(tableAction(s, 'hold'), 'none');
  assert.equal(canHoldToPull(s), false);
  spin(s, seq([at(2), at(2)]));
  assert.equal(canHoldToPull(s), true);
  pull(s, 'player');
  assert.equal(s.over, true);
  assert.equal(tableAction(s, 'hold'), 'none');
  assert.equal(tableAction(s, 'tap'), 'none');
  assert.equal(canHoldToPull(s), false);
});

test('no table gesture acts for the player on the HOUSE turn', () => {
  const s = createMatch('ai', seq([0]));
  spin(s, seq([at(5), at(0)]));
  pull(s, 'player');
  assert.equal(s.aiTurn, true);
  for (const g of ['tap', 'swipe', 'hold', 'none']) {
    assert.equal(tableAction(s, g), 'none', g);
  }
  assert.equal(canHoldToPull(s), false);
});
