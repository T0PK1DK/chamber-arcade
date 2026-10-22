import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAST, pickCharacter, characterById } from '../src/game/characters.js';

test('the cast has unique ids and titles and complete looks', () => {
  assert.ok(CAST.length >= 5);
  assert.equal(new Set(CAST.map((c) => c.id)).size, CAST.length);
  assert.equal(new Set(CAST.map((c) => c.title)).size, CAST.length);
  for (const c of CAST) {
    for (const k of ['skin', 'hair', 'suit', 'shirt', 'tie']) assert.equal(typeof c[k], 'number', `${c.id}.${k}`);
    assert.ok(['slick', 'short', 'bob', 'bald', 'side'].includes(c.hairStyle), c.id);
    assert.ok(['none', 'mustache', 'beard', 'stubble'].includes(c.facial), c.id);
    assert.ok(['none', 'fedora'].includes(c.hat), c.id);
    assert.match(c.title, /^THE [A-Z]+$/, 'nicknames only, no personal names');
  }
});

test('pickCharacter covers the cast and never repeats the last opponent', () => {
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) seen.add(pickCharacter(() => (i % 10) / 10).id);
  assert.equal(seen.size, CAST.length);
  for (let i = 0; i < 20; i += 1) {
    assert.notEqual(pickCharacter(() => i / 20, 'banker').id, 'banker');
  }
  assert.ok(pickCharacter(() => 0.9999));
});

test('characterById falls back to the first seat', () => {
  assert.equal(characterById('widow').title, 'THE WIDOW');
  assert.equal(characterById('nobody'), CAST[0]);
});
