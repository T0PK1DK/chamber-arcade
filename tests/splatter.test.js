import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeSplatter, paintSplatter } from '../src/game/splatter.js';

function lcg(seed = 7) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

test('same seed gives the same spatter', () => {
  assert.deepEqual(makeSplatter(lcg(3)), makeSplatter(lcg(3)));
  assert.notDeepEqual(makeSplatter(lcg(3)), makeSplatter(lcg(4)));
});

test('counts follow options and every point stays inside the box', () => {
  const s = makeSplatter(lcg(), { blobs: 4, drops: 30, drips: 2, cx: 0.95, cy: 0.05 });
  assert.equal(s.blobs.length, 4);
  assert.equal(s.drops.length, 30);
  assert.equal(s.drips.length, 2);
  for (const p of [...s.blobs, ...s.drops]) {
    assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
    assert.ok(p.r > 0);
  }
});

test('a directed spray lands on its side of the origin', () => {
  const s = makeSplatter(lcg(9), { cx: 0.2, angle: 0, spread: 0.6, drops: 60 });
  const right = s.drops.filter((d) => d.x > 0.2).length;
  assert.ok(right / s.drops.length > 0.9);
});

test('drips hang from the largest blobs and run downward', () => {
  const s = makeSplatter(lcg(5), { blobs: 6, drips: 3 });
  const biggest = s.blobs.map((b) => b.r).sort((a, b) => b - a)[2];
  assert.equal(s.drips.length, 3);
  for (const d of s.drips) assert.ok(d.len > 0 && d.w > 0);
  assert.ok(biggest > 0);
});

test('paintSplatter draws every shape into a 2D context', () => {
  const calls = { arc: 0, fill: 0 };
  const ctx = {
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
    arc() { calls.arc += 1; },
    fill() { calls.fill += 1; },
    createRadialGradient() { return { addColorStop() {} }; },
    set fillStyle(v) { this._f = v; },
  };
  const s = makeSplatter(lcg(), { blobs: 3, drops: 10, drips: 2 });
  paintSplatter(ctx, 200, 100, s);
  assert.equal(calls.fill, 3 + 10 + 2);
});
