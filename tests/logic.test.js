import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAMBERS,
  createMatch,
  spin,
  pull,
  useItem,
  nextRound,
  resetMatch,
  canSpin,
  canPull,
  oddsDenom,
  ITEMS,
} from '../src/game/logic.js';
import { decideAi } from '../src/game/ai.js';

function seq(values) {
  let i = 0;
  return () => {
    const v = values[Math.min(i, values.length - 1)];
    i += 1;
    return v;
  };
}

/** Map chamber index 0-5 onto rng() so Math.floor(rng()*6) === index. */
const at = (index) => (index + 0.1) / CHAMBERS;

test('fair: every spin is a fresh 1/6 and a safe click demands another spin', () => {
  const s = createMatch('fair', seq([at(0), at(1)]));
  assert.equal(spin(s, seq([at(0), at(1)])).ok, true);
  assert.equal(oddsDenom(s), 6);
  assert.notEqual(s.current, s.bullet);
  const r = pull(s);
  assert.equal(r.hit, false);
  assert.equal(s.survived, 1);
  assert.equal(s.spun, false);
  assert.equal(canSpin(s), true);
  assert.equal(canPull(s), false);
});

test('classic: chamber advances and odds rise; sixth empty is impossible if live remains', () => {
  const s = createMatch('classic');
  // live in 5, start at 0 — five safe then a hit
  assert.equal(spin(s, seq([at(5), at(0)])).ok, true);
  for (let i = 0; i < 5; i += 1) {
    assert.equal(oddsDenom(s), 6 - i);
    const r = pull(s);
    assert.equal(r.hit, false);
  }
  assert.equal(s.survived, 5);
  assert.equal(oddsDenom(s), 1);
  const last = pull(s);
  assert.equal(last.hit, true);
  assert.equal(s.over, true);
  assert.equal(s.survived, 5);
  assert.equal(canSpin(s), false);
});

test('game over rejects spin and pull (no stuck-button trap)', () => {
  const s = createMatch('classic');
  spin(s, seq([at(0), at(0)]));
  assert.equal(pull(s).hit, true);
  assert.equal(spin(s).ok, false);
  assert.equal(pull(s).ok, false);
});

test('vs ai: one load, turns alternate, score counts only the player', () => {
  const s = createMatch('ai', seq([at(0)])); // items
  spin(s, seq([at(5), at(0)]));
  const p = pull(s);
  assert.equal(p.hit, false);
  assert.equal(s.survived, 1);
  assert.equal(s.aiTurn, true);
  assert.equal(s.busy, true);
  const a = pull(s);
  assert.equal(a.hit, false);
  assert.equal(a.byAi, true);
  assert.equal(s.survived, 1);
  assert.equal(s.aiTurn, false);
  assert.equal(s.busy, false);
});

test('vs ai: house hit awards the player the round', () => {
  const s = createMatch('ai', () => 0);
  spin(s, seq([at(1), at(0)]));
  pull(s); // player safe, current -> 1
  assert.equal(s.aiTurn, true);
  const a = pull(s);
  assert.equal(a.hit, true);
  assert.equal(s.winner, 'player');
  assert.equal(s.playerRoundWins, 1);
  assert.equal(s.matchOver, false);
});

test('scope peeks the current chamber without spending it', () => {
  const s = createMatch('ai', () => 0);
  s.playerItems = [ITEMS.scope];
  spin(s, seq([at(0), at(0)]));
  const r = useItem(s, ITEMS.scope, 'player');
  assert.equal(r.peek, 'live');
  assert.equal(s.spun, true);
  assert.equal(s.over, false);
  assert.equal(s.playerItems.length, 0);
});

test('rack of the live chamber forces a respin', () => {
  const s = createMatch('ai', () => 0);
  s.playerItems = [ITEMS.rack];
  spin(s, seq([at(2), at(2)]));
  const r = useItem(s, ITEMS.rack, 'player');
  assert.equal(r.ejected, 'live');
  assert.equal(s.spun, false);
  assert.equal(canSpin(s), true);
});

test('stun skips the house after a safe player pull', () => {
  const s = createMatch('ai', () => 0);
  s.playerItems = [ITEMS.stun];
  spin(s, seq([at(5), at(0)]));
  useItem(s, ITEMS.stun, 'player');
  pull(s);
  assert.equal(s.aiTurn, false);
  assert.equal(s.stunOn, null);
});

test('best of three matchOver after two round wins', () => {
  const s = createMatch('ai', () => 0);
  spin(s, seq([at(0), at(0)]));
  pull(s);
  assert.equal(s.winner, 'ai');
  assert.equal(nextRound(s, () => 0).ok, true);
  spin(s, seq([at(0), at(0)]));
  pull(s);
  assert.equal(s.matchOver, true);
  assert.equal(s.aiRoundWins, 2);
  assert.equal(nextRound(s).ok, false);
});

test('resetMatch clears a finished table', () => {
  const s = createMatch('fair');
  spin(s, seq([at(0), at(0)]));
  pull(s);
  resetMatch(s, () => 0);
  assert.equal(s.over, false);
  assert.equal(s.survived, 0);
  assert.equal(s.spun, false);
});

test('HOUSE racks a known live and otherwise pulls', () => {
  const s = createMatch('ai', () => 0);
  s.aiTurn = true;
  s.busy = true;
  s.spun = true;
  s.bullet = 0;
  s.current = 0;
  s.peek = 'live';
  s.aiItems = [ITEMS.rack];
  assert.deepEqual(decideAi(s), { type: 'item', item: ITEMS.rack });
  s.aiItems = [];
  assert.deepEqual(decideAi(s), { type: 'pull' });
});
