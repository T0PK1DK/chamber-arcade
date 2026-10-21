import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = {
  getItem(key) {
    return mem.has(key) ? mem.get(key) : null;
  },
  setItem(key, value) {
    mem.set(key, String(value));
  },
  removeItem(key) {
    mem.delete(key);
  },
  clear() {
    mem.clear();
  },
};

const {
  loadScores,
  saveBest,
  recordAiMatch,
  loadMuted,
  saveMuted,
  migrate,
} = await import('../src/game/storage.js');

beforeEach(() => {
  mem.clear();
});

test('migrate copies the legacy chamberBest key into fair', () => {
  mem.set('chamberBest', '7');
  migrate();
  assert.equal(loadScores().fair, 7);
});

test('migrate does not overwrite an existing fair best', () => {
  mem.set('chamberBest', '9');
  mem.set('chamberBest_fair', '2');
  migrate();
  assert.equal(loadScores().fair, 2);
});

test('saveBest only rises and only for streak modes', () => {
  assert.equal(saveBest('fair', 3), true);
  assert.equal(saveBest('fair', 2), false);
  assert.equal(saveBest('fair', 5), true);
  assert.equal(saveBest('ai', 9), false);
  assert.equal(loadScores().fair, 5);
  assert.equal(saveBest('classic', 4), true);
  assert.equal(loadScores().classic, 4);
});

test('recordAiMatch increments wins or losses', () => {
  recordAiMatch(true);
  recordAiMatch(true);
  recordAiMatch(false);
  const s = loadScores();
  assert.equal(s.aiWins, 2);
  assert.equal(s.aiLosses, 1);
});

test('mute persists as 1/0', () => {
  assert.equal(loadMuted(), false);
  saveMuted(true);
  assert.equal(loadMuted(), true);
  saveMuted(false);
  assert.equal(loadMuted(), false);
});
