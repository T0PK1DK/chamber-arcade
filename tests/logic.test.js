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
  canUseItem,
  oddsDenom,
  snapshot,
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

test('unknown mode throws', () => {
  assert.throws(() => createMatch('buckshot'), /unknown mode/);
});

test('fair first-chamber hit scores zero and locks the table', () => {
  const s = createMatch('fair');
  spin(s, seq([at(2), at(2)]));
  const r = pull(s);
  assert.equal(r.hit, true);
  assert.equal(s.survived, 0);
  assert.equal(s.over, true);
  assert.equal(canSpin(s), false);
  assert.equal(canPull(s), false);
});

test('cannot pull, item, or peek before spin', () => {
  const s = createMatch('ai', () => 0);
  s.playerItems = [ITEMS.scope];
  assert.equal(canPull(s), false);
  assert.equal(canUseItem(s, 'player'), false);
  assert.equal(pull(s).ok, false);
  assert.equal(useItem(s, ITEMS.scope, 'player').ok, false);
});

test('player pull is rejected during HOUSE turn', () => {
  const s = createMatch('ai', () => 0);
  spin(s, seq([at(5), at(0)]));
  pull(s, 'player');
  assert.equal(s.aiTurn, true);
  assert.equal(pull(s, 'player').ok, false);
  assert.equal(pull(s, 'player').reason, 'ai-turn');
  assert.equal(s.over, false);
  assert.equal(s.pulls, 1);
});

test('ai pull is rejected during the player turn', () => {
  const s = createMatch('ai', () => 0);
  spin(s, seq([at(5), at(0)]));
  assert.equal(pull(s, 'ai').ok, false);
  assert.equal(pull(s, 'ai').reason, 'player-turn');
});

test('rack of a blank advances the chamber and keeps the drum loaded', () => {
  const s = createMatch('ai', () => 0);
  s.playerItems = [ITEMS.rack];
  spin(s, seq([at(5), at(0)]));
  const r = useItem(s, ITEMS.rack, 'player');
  assert.equal(r.ejected, 'blank');
  assert.equal(s.spun, true);
  assert.equal(s.current, 1);
  assert.equal(s.pulls, 1);
  assert.equal(s.tell, false);
});

test('HOUSE scope of a live chamber sets tell; pull clears it', () => {
  const s = createMatch('ai', () => 0);
  s.aiTurn = true;
  s.busy = true;
  s.spun = true;
  s.bullet = 0;
  s.current = 0;
  s.aiItems = [ITEMS.scope];
  const r = useItem(s, ITEMS.scope, 'ai');
  assert.equal(r.peek, 'live');
  assert.equal(s.tell, true);
  pull(s, 'ai');
  assert.equal(s.tell, false);
});

test('player scope does not give HOUSE a tell', () => {
  const s = createMatch('ai', () => 0);
  s.playerItems = [ITEMS.scope];
  spin(s, seq([at(0), at(0)]));
  useItem(s, ITEMS.scope, 'player');
  assert.equal(s.peek, 'live');
  assert.equal(s.tell, false);
});

test('stun on the player lets HOUSE pull again', () => {
  const s = createMatch('ai', () => 0);
  s.aiItems = [ITEMS.stun];
  s.aiTurn = true;
  s.busy = true;
  s.spun = true;
  s.bullet = 5;
  s.current = 0;
  useItem(s, ITEMS.stun, 'ai');
  const r = pull(s, 'ai');
  assert.equal(r.hit, false);
  assert.equal(s.aiTurn, true);
  assert.equal(s.busy, true);
  assert.equal(s.stunOn, null);
});

test('nextRound deals two chips from round 2', () => {
  const s = createMatch('ai', () => 0);
  spin(s, seq([at(0), at(0)]));
  pull(s);
  assert.equal(nextRound(s, () => 0).ok, true);
  assert.equal(s.round, 2);
  assert.equal(s.playerItems.length, 2);
  assert.equal(s.aiItems.length, 2);
  assert.equal(s.tell, false);
  assert.equal(s.spun, false);
});

test('player wins the match after two HOUSE hits', () => {
  const s = createMatch('ai', () => 0);
  spin(s, seq([at(1), at(0)]));
  pull(s, 'player');
  pull(s, 'ai');
  assert.equal(s.playerRoundWins, 1);
  nextRound(s, () => 0);
  spin(s, seq([at(1), at(0)]));
  pull(s, 'player');
  pull(s, 'ai');
  assert.equal(s.playerRoundWins, 2);
  assert.equal(s.matchOver, true);
  assert.match(s.status, /YOU WIN/);
});

test('snapshot copies item bags', () => {
  const s = createMatch('ai', () => 0);
  s.playerItems = [ITEMS.scope];
  const snap = snapshot(s);
  snap.playerItems.push(ITEMS.stun);
  assert.deepEqual(s.playerItems, [ITEMS.scope]);
});

test('fair odds stay 1/6 after a safe click because the drum is unloaded', () => {
  const s = createMatch('fair', seq([at(0), at(1)]));
  spin(s, seq([at(0), at(1)]));
  pull(s);
  assert.equal(s.spun, false);
  assert.equal(oddsDenom(s), 6);
});


