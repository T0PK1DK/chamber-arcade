import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAMBERS,
  STAKE,
  ITEMS,
  createMatch,
  spin,
  pull,
  useItem,
  cashOut,
  canCashOut,
  oddsDenom,
  potAfter,
} from '../src/game/logic.js';
import { decideAi } from '../src/game/ai.js';

function seq(values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}
const at = (index) => (index + 0.1) / CHAMBERS;

test('classic pot pays fair odds: 6/(6 - safe pulls) × stake', () => {
  assert.equal(potAfter('classic', 0), 0);
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => potAfter('classic', n)), [120, 150, 200, 300, 600]);
  assert.equal(potAfter('classic', 6), 0);
});

test('fair pot grows ×1.2 per safe pull', () => {
  assert.deepEqual([1, 2, 3].map((n) => potAfter('fair', n)), [120, 144, 173]);
  assert.equal(potAfter('ai', 3), 0);
});

test('fair odds: expected pot of always pulling once more equals the pot you hold', () => {
  for (let n = 0; n < CHAMBERS - 1; n += 1) {
    const hold = n === 0 ? STAKE : potAfter('classic', n);
    const survive = (CHAMBERS - n - 1) / (CHAMBERS - n);
    assert.ok(Math.abs(survive * potAfter('classic', n + 1) - hold) < 1);
  }
});

test('cash out needs at least one safe pull, then ends the run as a win', () => {
  const s = createMatch('classic');
  assert.equal(canCashOut(s), false);
  assert.equal(cashOut(s).ok, false);
  spin(s, seq([at(4), at(0)]));
  assert.equal(canCashOut(s), false);
  pull(s, 'player');
  assert.equal(s.pot, 120);
  assert.equal(canCashOut(s), true);
  const r = cashOut(s);
  assert.deepEqual(r, { ok: true, pot: 120 });
  assert.equal(s.over, true);
  assert.equal(s.winner, 'cash');
  assert.equal(s.cashed, 120);
  assert.match(s.status, /CASHED OUT \$120/);
  assert.equal(pull(s, 'player').ok, false);
  assert.equal(cashOut(s).ok, false);
});

test('a hit loses the pot', () => {
  const s = createMatch('classic');
  spin(s, seq([at(2), at(0)]));
  pull(s, 'player');
  pull(s, 'player');
  assert.equal(s.pot, 150);
  pull(s, 'player');
  assert.equal(s.over, true);
  assert.equal(s.pot, 0);
  assert.match(s.status, /LOST \$150/);
  assert.equal(canCashOut(s), false);
});

test('fair mode can cash out between spins', () => {
  const s = createMatch('fair');
  spin(s, seq([at(3), at(0)]));
  pull(s, 'player');
  assert.equal(s.spun, false);
  assert.equal(canCashOut(s), true);
  assert.equal(cashOut(s).pot, 120);
});

test('the duel has no pot and no cash out', () => {
  const s = createMatch('ai');
  spin(s, seq([at(4), at(0)]));
  pull(s, 'player');
  assert.equal(s.pot, 0);
  assert.equal(canCashOut(s), false);
});

test('re-spin (variant chip) resets the odds to 1 in 6, keeps the turn, and is single use', () => {
  const s = createMatch('ai');
  s.playerItems = [ITEMS.respin];
  spin(s, seq([at(5), at(0)]));
  s.pulls = 3;
  assert.equal(oddsDenom(s), 3);
  const r = useItem(s, ITEMS.respin, 'player', seq([at(1), at(4)]));
  assert.equal(r.ok, true);
  assert.equal(s.bullet, 1);
  assert.equal(s.current, 4);
  assert.equal(oddsDenom(s), 6);
  assert.equal(s.aiTurn, false);
  assert.equal(s.spun, true);
  assert.equal(useItem(s, ITEMS.respin, 'player').ok, false);
});

test('HOUSE with a re-spin chip still shoots you at 1 in 3 rather than reset the odds', () => {
  const s = createMatch('ai');
  Object.assign(s, { aiTurn: true, busy: true, spun: true, bullet: 0, current: 2, pulls: 3, aiItems: [ITEMS.respin] });
  assert.deepEqual(decideAi(s, () => 0.5), { type: 'pull', target: 'other' });
});

test('duel aim: blank on yourself keeps the turn, blank at HOUSE passes it', () => {
  const s = createMatch('ai');
  spin(s, seq([at(3), at(0)]));
  let r = pull(s, 'player', 'self');
  assert.deepEqual([r.hit, r.target, s.aiTurn, s.survived], [false, 'self', false, 1]);
  assert.match(s.status, /KEEP THE TURN/);
  r = pull(s, 'player', 'other');
  assert.deepEqual([r.hit, r.target, s.aiTurn, s.survived], [false, 'other', true, 2]);
  r = pull(s, 'ai', 'self');
  assert.equal(s.aiTurn, true);
  assert.match(s.status, /HOUSE SURVIVES/);
});

test('duel aim: the round goes to whoever was not hit', () => {
  const youShootHouse = createMatch('ai');
  spin(youShootHouse, seq([at(0), at(0)]));
  let r = pull(youShootHouse, 'player', 'other');
  assert.deepEqual([r.hit, r.victim, youShootHouse.winner], [true, 'ai', 'player']);
  assert.match(youShootHouse.status, /YOU SHOT HOUSE/);

  const houseShootsYou = createMatch('ai');
  spin(houseShootsYou, seq([at(1), at(0)]));
  pull(houseShootsYou, 'player', 'other');
  r = pull(houseShootsYou, 'ai', 'other');
  assert.deepEqual([r.hit, r.victim, houseShootsYou.winner], [true, 'player', 'ai']);
  assert.match(houseShootsYou.status, /HOUSE SHOT YOU/);
});

test('solo modes ignore the aim: you can only shoot yourself', () => {
  const s = createMatch('classic');
  spin(s, seq([at(0), at(0)]));
  const r = pull(s, 'player', 'other');
  assert.deepEqual([r.target, r.victim], ['self', 'player']);
});

test('PASS hands over unfired, once per side per round, duel only', async () => {
  const { pass, canPass, nextRound } = await import('../src/game/logic.js');
  const s = createMatch('ai');
  assert.equal(canPass(s), false); // not loaded yet
  spin(s, seq([at(4), at(0)]));
  assert.equal(pass(s, 'player').ok, true);
  assert.equal(s.aiTurn, true);
  assert.equal(s.pulls, 0);
  assert.equal(s.current, 0);
  assert.equal(pass(s, 'player').ok, false); // not your turn
  assert.equal(pass(s, 'ai').ok, true);
  assert.equal(s.aiTurn, false);
  assert.equal(canPass(s, 'player'), false); // spent
  pull(s, 'player', 'other');
  pull(s, 'ai', 'other');
  pull(s, 'player', 'other');
  pull(s, 'ai', 'other');
  assert.equal(pull(s, 'player', 'other').hit, true);
  nextRound(s);
  assert.deepEqual(s.passes, { player: 1, ai: 1 });
  assert.equal(canPass(createMatch('classic')), false);
});
