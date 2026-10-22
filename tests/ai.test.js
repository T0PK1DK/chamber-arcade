import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, ITEMS } from '../src/game/logic.js';
import { decideAi, scopeThreshold, passChance, passMinDenom, otherChance } from '../src/game/ai.js';
import { characterById, HOUSE_PERSONA } from '../src/game/characters.js';

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

test('HOUSE midpoint odds stay 1.00 / 0.65 / 0.35 and a 0.10 pass', () => {
  assert.equal(otherChance(HOUSE_PERSONA.aggression, 3), 1);
  assert.equal(otherChance(HOUSE_PERSONA.aggression, 4), 0.65);
  assert.equal(otherChance(HOUSE_PERSONA.aggression, 6), 0.35);
  assert.equal(passChance(HOUSE_PERSONA.caution), 0.1);
  assert.equal(passMinDenom(HOUSE_PERSONA.caution), 5);
  assert.equal(scopeThreshold(HOUSE_PERSONA.tell), 3);
});

test('1 in 3 or worse still shoots you for every seat (HOUSE odds lock)', () => {
  for (const id of ['banker', 'captain', 'widow', 'gambler', 'stranger', 'professor']) {
    const persona = characterById(id).persona;
    for (const pulls of [3, 4, 5]) {
      assert.deepEqual(
        decideAi(house({ pulls }), fixed(0.99), persona),
        { type: 'pull', target: 'other' },
        `${id} at pulls=${pulls}`,
      );
    }
  }
});

test('the Widow aims across on long odds where HOUSE would test its nerve', () => {
  const widow = characterById('widow').persona;
  // HOUSE at denom 6, roll 0.40 → self (0.40 > 0.35). Widow otherP ≈ 0.49.
  assert.deepEqual(decideAi(house({ pulls: 0 }), fixed(0.40)), { type: 'pull', target: 'self' });
  assert.deepEqual(decideAi(house({ pulls: 0 }), fixed(0.40), widow), { type: 'pull', target: 'other' });
});

test('the Banker passes more often and the Gambler almost never does', () => {
  const banker = characterById('banker').persona;
  const gambler = characterById('gambler').persona;
  // roll 0.12: HOUSE does not pass (0.12 > 0.10) and shoots you (0.12 < 0.35).
  assert.deepEqual(decideAi(house({ pulls: 0 }), fixed(0.12)), { type: 'pull', target: 'other' });
  assert.deepEqual(decideAi(house({ pulls: 0 }), fixed(0.12), banker), { type: 'pass' });
  assert.deepEqual(decideAi(house({ pulls: 0 }), fixed(0.05), gambler), { type: 'pull', target: 'other' });
});

test('the Professor peeks earlier; the Gambler waits until it is ugly', () => {
  const professor = characterById('professor').persona;
  const gambler = characterById('gambler').persona;
  const scoped = house({ pulls: 1, aiItems: [ITEMS.scope] });
  assert.deepEqual(decideAi(scoped, fixed(0.9)), { type: 'pull', target: 'self' });
  assert.deepEqual(decideAi(scoped, fixed(0.9), professor), { type: 'item', item: ITEMS.scope });
  assert.deepEqual(
    decideAi(house({ pulls: 3, aiItems: [ITEMS.scope] }), fixed(0.9), gambler),
    { type: 'pull', target: 'other' },
  );
});

test('known chamber still overrides personality', () => {
  const widow = characterById('widow').persona;
  assert.deepEqual(decideAi(house({ peek: 'blank', pulls: 4 }), fixed(0.01), widow), { type: 'pull', target: 'self' });
  assert.deepEqual(decideAi(house({ peek: 'live', pulls: 0 }), fixed(0.99), characterById('banker').persona), {
    type: 'pull', target: 'other',
  });
});
