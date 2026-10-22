import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, spin, pull, cashOut } from '../src/game/logic.js';
import { tableLiveText } from '../src/game/announce.js';

const at = (index) => (index + 0.1) / 6;
function seq(values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

test('tableLiveText covers turn, chambers, odds, pot, and result', () => {
  const s = createMatch('classic');
  const idle = tableLiveText(s);
  assert.match(idle, /Spin the cylinder/);
  assert.match(idle, /6 of 6 chambers left/);
  assert.match(idle, /Cylinder not loaded/);
  assert.match(idle, /Stake \$100/);

  spin(s, seq([at(4), at(0)]));
  const loaded = tableLiveText(s);
  assert.match(loaded, /Your move/);
  assert.match(loaded, /1 in 6 is live/);
  assert.match(loaded, /Stake \$100/);

  pull(s, 'player');
  const safe = tableLiveText(s);
  assert.match(safe, /5 of 6 chambers left/);
  assert.match(safe, /1 in 5 is live/);
  assert.match(safe, /Pot \$120/);
  assert.match(safe, /SAFE/);
});

test('tableLiveText names the opponent and the score in a duel', () => {
  const s = createMatch('ai');
  spin(s, seq([at(5), at(0)]));
  pull(s, 'player', 'other');
  const said = tableLiveText(s, 'THE BANKER');
  assert.match(said, /THE BANKER has the revolver/);
  assert.match(said, /5 of 6 chambers left/);
  assert.match(said, /1 in 5 is live/);
  assert.match(said, /Score you 0, THE BANKER 0/);
  assert.doesNotMatch(said, /\bHOUSE\b/);
});

test('tableLiveText speaks a cash-out and a hit', () => {
  const cash = createMatch('fair');
  spin(cash, seq([at(3), at(0)]));
  pull(cash, 'player');
  cashOut(cash);
  const banked = tableLiveText(cash);
  assert.match(banked, /Run over|CASHED OUT/i);
  assert.match(banked, /Banked \$120/);

  const hit = createMatch('classic');
  spin(hit, seq([at(0), at(0)]));
  pull(hit, 'player');
  const lost = tableLiveText(hit);
  assert.match(lost, /Take-home \$0/);
  assert.match(lost, /OUT/);
});

test('tableLiveText is empty-safe', () => {
  assert.equal(tableLiveText(null), 'No table.');
});
