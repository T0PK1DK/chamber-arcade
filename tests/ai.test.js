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

test('HOUSE waits when it is not their turn', () => {
  const s = house({ aiTurn: false, busy: false });
  assert.deepEqual(decideAi(s), { type: 'wait' });
});

test('HOUSE scopes when the drum is short and unread', () => {
  const s = house({ pulls: 3, aiItems: [ITEMS.scope] });
  assert.deepEqual(decideAi(s), { type: 'item', item: ITEMS.scope });
});

test('HOUSE does not scope when odds are still 1/6', () => {
  const s = house({ pulls: 0, aiItems: [ITEMS.scope] });
  assert.deepEqual(decideAi(s), { type: 'pull' });
});

test('HOUSE pulls a known blank instead of spending stun', () => {
  const s = house({ peek: 'blank', pulls: 4, aiItems: [ITEMS.stun] });
  assert.deepEqual(decideAi(s), { type: 'pull' });
});

test('HOUSE stuns when odds are ugly and the chamber is unread', () => {
  const s = house({ pulls: 4, aiItems: [ITEMS.stun] });
  assert.deepEqual(decideAi(s), { type: 'item', item: ITEMS.stun });
});
