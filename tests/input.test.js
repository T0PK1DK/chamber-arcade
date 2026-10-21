import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, spin, pull, ITEMS } from '../src/game/logic.js';
import {
  itemFromDigit,
  isMenuKey,
  isMuteKey,
  isPrimaryKey,
  modeFromMenuKey,
  spaceAction,
} from '../src/game/input.js';

function seq(values) {
  let i = 0;
  return () => {
    const v = values[Math.min(i, values.length - 1)];
    i += 1;
    return v;
  };
}
const at = (index) => (index + 0.1) / 6;

test('menu keys 1–3 map to modes and ignore junk', () => {
  assert.equal(modeFromMenuKey('1'), 'fair');
  assert.equal(modeFromMenuKey('2'), 'classic');
  assert.equal(modeFromMenuKey('3'), 'ai');
  assert.equal(modeFromMenuKey('4'), null);
  assert.equal(modeFromMenuKey(' '), null);
});

test('Space never pulls for HOUSE', () => {
  const s = createMatch('ai', () => 0);
  assert.equal(spaceAction(s), 'spin');
  spin(s, seq([at(5), at(0)]));
  assert.equal(spaceAction(s), 'pull');
  pull(s, 'player');
  assert.equal(s.aiTurn, true);
  assert.equal(spaceAction(s), 'none');
});

test('Space after a finished fair run is play-again', () => {
  const s = createMatch('fair');
  spin(s, seq([at(0), at(0)]));
  pull(s);
  assert.equal(spaceAction(s), 'again');
});

test('Space after a HOUSE round (match still open) is next', () => {
  const s = createMatch('ai', () => 0);
  spin(s, seq([at(0), at(0)]));
  pull(s);
  assert.equal(s.over, true);
  assert.equal(s.matchOver, false);
  assert.equal(spaceAction(s), 'next');
});

test('digit keys pick player chips only', () => {
  const s = createMatch('ai', () => 0);
  s.playerItems = [ITEMS.scope, ITEMS.stun];
  assert.equal(itemFromDigit(s, '1'), ITEMS.scope);
  assert.equal(itemFromDigit(s, '2'), ITEMS.stun);
  assert.equal(itemFromDigit(s, '3'), null);
  assert.equal(itemFromDigit(s, 'a'), null);
});

test('modifier helpers', () => {
  assert.equal(isPrimaryKey('Space'), true);
  assert.equal(isPrimaryKey('Enter'), true);
  assert.equal(isMenuKey('Escape'), true);
  assert.equal(isMuteKey('KeyM'), true);
  assert.equal(isMuteKey('KeyN'), false);
});
