import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFeel, HITSTOP_BANG } from '../src/game/feel.js';
import { framing, portraitBlend } from '../src/scene/framing.js';

test('bang freezes the sim for the hit-stop, then resumes', () => {
  const f = createFeel();
  f.kick('bang');
  assert.equal(f.stopped, true);
  assert.equal(f.step(0.05), 0);
  const sim = f.step(0.05);
  assert.ok(Math.abs(sim - (0.1 - HITSTOP_BANG)) < 1e-9);
  assert.equal(f.stopped, false);
  assert.equal(f.step(0.016), 0.016);
});

test('shake is trauma squared and decays to rest', () => {
  const f = createFeel();
  f.kick('click');
  assert.ok(Math.abs(f.shake - 0.32 ** 2) < 1e-9);
  for (let i = 0; i < 120; i += 1) f.step(1 / 60);
  assert.equal(f.shake, 0);
  assert.equal(f.punch, 0);
});

test('a small kick never cancels a bigger one already running', () => {
  const f = createFeel();
  f.kick('bang');
  f.kick('click');
  assert.equal(f.shake, 1);
  assert.equal(f.flash, 1);
});

test('reduced motion: no shake, punch, fov or hit-stop, only a soft flash', () => {
  const f = createFeel({ calm: true });
  f.kick('bang');
  assert.equal(f.shake, 0);
  assert.equal(f.punch, 0);
  assert.equal(f.fov, 0);
  assert.equal(f.stopped, false);
  assert.ok(f.flash > 0 && f.flash < 1);
  f.kick('click');
  assert.equal(f.step(0.016), 0.016);
});

test('unknown kicks are ignored and reset clears everything', () => {
  const f = createFeel();
  f.kick('nope');
  assert.equal(f.shake, 0);
  f.kick('bang');
  f.reset();
  assert.equal(f.shake + f.punch + f.fov + f.flash, 0);
  assert.equal(f.stopped, false);
});

test('framing: landscape keeps the original shot, portrait backs off and widens', () => {
  assert.equal(portraitBlend(16 / 9), 0);
  assert.equal(portraitBlend(390 / 844), 1);
  assert.equal(portraitBlend(0), 0);
  assert.equal(portraitBlend(Number.NaN), 0);
  const wide = framing(16 / 9);
  const tall = framing(390 / 844);
  assert.ok(tall.fov > wide.fov);
  assert.ok(tall.fov <= 70);
  assert.ok(tall.home[2] > wide.home[2]);
  assert.ok(tall.home[1] > wide.home[1]);
  // The pull shot always moves toward the table.
  for (const f of [wide, tall, framing(1)]) {
    assert.ok(f.pull[2] < f.home[2]);
    assert.ok(f.pull[1] < f.home[1]);
  }
});
