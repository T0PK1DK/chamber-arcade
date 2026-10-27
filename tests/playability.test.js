import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMatch,
  spin,
  pull,
  pass,
  nextRound,
  resetMatch,
  isPlayerTurn,
} from '../src/game/logic.js';
import { decideAi } from '../src/game/ai.js';
import { spaceAction } from '../src/game/input.js';

function rngFrom(seed) {
  let n = 0;
  return () => {
    n += 1;
    const x = Math.sin(seed * 999 + n * 17.13) * 10000;
    return x - Math.floor(x);
  };
}

function playToMatchEnd(seed) {
  const rng = rngFrom(seed);
  const state = createMatch('ai', rng);
  let steps = 0;
  while (!state.matchOver && steps++ < 300) {
    if (!state.spun) {
      assert.equal(spin(state, rng).ok, true);
      continue;
    }
    if (state.over) {
      assert.equal(nextRound(state, rng).ok, true);
      continue;
    }
    if (state.aiTurn) {
      const choice = decideAi(state, rng, state.persona);
      assert.notEqual(choice.type, 'wait');
      if (choice.type === 'pass') assert.equal(pass(state, 'ai').ok, true);
      else assert.equal(pull(state, 'ai', choice.target || 'self').ok, true);
      // Invariant: busy is only set while HOUSE holds the turn mid-round.
      if (!state.over) assert.equal(state.busy, state.aiTurn);
      continue;
    }
    assert.equal(state.busy, false, 'player turn must not be busy-locked');
    assert.equal(isPlayerTurn(state), true);
    const target = (6 - state.pulls) <= 3 ? 'other' : 'self';
    assert.equal(pull(state, 'player', target).ok, true);
  }
  assert.equal(state.matchOver, true);
  return state;
}

test('VS AI finishes a best-of-3 match without softlocking busy', () => {
  for (let seed = 1; seed <= 25; seed += 1) {
    const state = playToMatchEnd(seed);
    assert.ok(state.playerRoundWins >= 2 || state.aiRoundWins >= 2 || state.round >= 3);
    assert.equal(spaceAction(state), 'again');
  }
});

test('REMATCH / resetMatch returns a fresh loadable duel', () => {
  const state = playToMatchEnd(7);
  resetMatch(state);
  assert.equal(state.over, false);
  assert.equal(state.matchOver, false);
  assert.equal(state.spun, false);
  assert.equal(state.playerRoundWins, 0);
  assert.equal(state.aiRoundWins, 0);
  assert.equal(state.busy, false);
  assert.equal(spaceAction(state), 'spin');
  assert.equal(spin(state).ok, true);
  assert.equal(spaceAction(state), 'pull');
});

test('missing across the table sets busy for HOUSE then clears on your turn', () => {
  // Force: chamber 0 live, start at 1 so first pull is blank.
  const state = createMatch('ai', () => 0);
  state.bullet = 0;
  state.current = 1;
  state.spun = true;
  const r = pull(state, 'player', 'other');
  assert.equal(r.ok, true);
  assert.equal(r.hit, false);
  assert.equal(state.aiTurn, true);
  assert.equal(state.busy, true);
  // HOUSE shoots self on a blank (current advanced to 2, bullet 0).
  const r2 = pull(state, 'ai', 'self');
  assert.equal(r2.ok, true);
  assert.equal(r2.hit, false);
  assert.equal(state.aiTurn, true);
  assert.equal(state.busy, true);
  // HOUSE misses across → your turn, busy cleared.
  state.current = 1; // blank again relative to bullet 0
  const r3 = pull(state, 'ai', 'other');
  assert.equal(r3.ok, true);
  assert.equal(r3.hit, false);
  assert.equal(state.aiTurn, false);
  assert.equal(state.busy, false);
  assert.equal(isPlayerTurn(state), true);
});
