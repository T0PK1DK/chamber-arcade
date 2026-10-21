import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectMobile, prefersReducedMotion, createQuality } from '../src/scene/quality.js';
import { shortestAngle } from '../src/game/math.js';

test('detectMobile reads UA and narrow widths', () => {
  assert.equal(detectMobile({ userAgent: 'Mozilla/5.0 iPhone' }, 1200), true);
  assert.equal(detectMobile({ userAgent: 'Mozilla/5.0 Macintosh' }, 390), true);
  assert.equal(detectMobile({ userAgent: 'Mozilla/5.0 Macintosh' }, 1280), false);
  assert.equal(detectMobile(undefined, 1280), false);
});

test('prefersReducedMotion is false without matchMedia', () => {
  assert.equal(prefersReducedMotion(undefined), false);
  assert.equal(prefersReducedMotion(() => ({ matches: true })), true);
});

test('mobile quality starts at tier 0 without extra lights or shadows', () => {
  const q = createQuality({ mobile: true, reducedMotion: false });
  assert.equal(q.tier, 0);
  assert.equal(q.shadows, false);
  assert.equal(q.antialias, false);
  assert.equal(q.extraLights, false);
  assert.equal(q.precision, 'mediump');
});

test('desktop quality drops a tier after a slow sample window', () => {
  const q = createQuality({ mobile: false, reducedMotion: false });
  assert.equal(q.tier, 1);
  const renderer = { setPixelRatio() {}, shadowMap: { enabled: true } };
  for (let i = 0; i < 45; i += 1) q.sample(1 / 20, renderer, 1000);
  q.sample(1 / 20, renderer, 4000);
  assert.equal(q.tier, 0);
  assert.equal(renderer.shadowMap.enabled, false);
});

test('shortestAngle wraps the long way around the circle', () => {
  assert.ok(Math.abs(shortestAngle(0, 0.2) - 0.2) < 1e-9);
  assert.ok(shortestAngle(0.1, Math.PI * 2 - 0.1) < 0);
  assert.ok(Math.abs(Math.abs(shortestAngle(0, Math.PI * 2 - 0.2)) - 0.2) < 1e-9);
});
