import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, ITEMS } from '../src/game/logic.js';
import { decideAi } from '../src/game/ai.js';

function house(extra = {}) {
  const s = createMatch('ai', () => 0);
  Object.assign(s, {
    aiTurn: true,
    busy: true,
    spun: true,
    over: false,
    bullet: 0,
    current: 0,
    pulls: 0,
    peek: null,
    aiItems: [],
    ...extra,
  });
  return s;
}
const fixed = (v) => () => v;

test('HOUSE waits when it is not their turn', () => {
  const s = house({ aiTurn: false, busy: false });
  assert.deepEqual(decideAi(s), { type: 'wait' });
});

test('HOUSE turns the gun on you once the odds are 1 in 3 or worse', () => {
  for (const pulls of [3, 4, 5]) {
    assert.deepEqual(decideAi(house({ pulls }), fixed(0.99)), { type: 'pull', target: 'other' });
  }
});

test('HOUSE mostly tests its own nerve on long odds', () => {
  assert.deepEqual(decideAi(house({ pulls: 0 }), fixed(0.9)), { type: 'pull', target: 'self' });
  assert.deepEqual(decideAi(house({ pulls: 1 }), fixed(0.2)), { type: 'pull', target: 'other' });
});

test('HOUSE sometimes passes on long odds, only while it still has a pass', () => {
  const s = house({ pulls: 0 });
  assert.deepEqual(decideAi(s, fixed(0.05)), { type: 'pass' });
  s.passes.ai = 0;
  assert.deepEqual(decideAi(s, fixed(0.05)), { type: 'pull', target: 'other' });
});

test('a known chamber decides the aim', () => {
  assert.deepEqual(decideAi(house({ peek: 'live', pulls: 0 })), { type: 'pull', target: 'other' });
  assert.deepEqual(decideAi(house({ peek: 'blank', pulls: 4 })), { type: 'pull', target: 'self' });
});

test('variant chips still run: scope when short and unread, stun when ugly', () => {
  assert.deepEqual(decideAi(house({ pulls: 3, aiItems: [ITEMS.scope] })), { type: 'item', item: ITEMS.scope });
  assert.deepEqual(decideAi(house({ pulls: 4, aiItems: [ITEMS.stun] })), { type: 'item', item: ITEMS.stun });
});
