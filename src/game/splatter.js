/**
 * Blood-spatter layout, pure numbers (no DOM / Three) so it is Node-tested.
 * Coordinates are normalised 0..1 inside the target box; the screen overlay
 * and the wall decal both paint from this.
 *
 * A spatter = a few big blobs near the origin, a ring of satellite drops
 * thrown along `angle`, and drips that run down from the larger blobs.
 */

export const FINISHES = Object.freeze(['blued', 'nickel', 'gold']);

export function makeSplatter(rng = Math.random, {
  cx = 0.5,
  cy = 0.5,
  blobs = 5,
  drops = 46,
  angle = 0,
  spread = Math.PI * 2,
  reach = 0.42,
  drips = 4,
} = {}) {
  const out = { blobs: [], drops: [], drips: [] };
  const clamp = (v) => Math.min(1, Math.max(0, v));

  for (let i = 0; i < blobs; i += 1) {
    const a = rng() * Math.PI * 2;
    const d = rng() * 0.06;
    out.blobs.push({
      x: clamp(cx + Math.cos(a) * d),
      y: clamp(cy + Math.sin(a) * d),
      r: 0.035 + rng() * 0.05,
    });
  }
  for (let i = 0; i < drops; i += 1) {
    const a = angle + (rng() - 0.5) * spread;
    // Bias drops outward so the spray reads as thrown, not stamped.
    const d = reach * (0.15 + rng() ** 0.6 * 0.85);
    out.drops.push({
      x: clamp(cx + Math.cos(a) * d),
      y: clamp(cy + Math.sin(a) * d),
      r: 0.004 + rng() * 0.016 * (1 - d / (reach * 1.2)),
    });
  }
  const big = out.blobs.slice().sort((p, q) => q.r - p.r).slice(0, drips);
  for (const b of big) {
    out.drips.push({
      x: b.x + (rng() - 0.5) * b.r,
      y: b.y,
      w: b.r * (0.18 + rng() * 0.18),
      len: 0.08 + rng() * 0.22,
    });
  }
  return out;
}

/** Paint a spatter into a 2D canvas context of size w×h. */
export function paintSplatter(ctx, w, h, s, color = '#6e0a0a', dark = '#3a0404') {
  ctx.fillStyle = color;
  for (const d of s.drips) {
    const x = d.x * w;
    const y = d.y * h;
    const len = d.len * h;
    const ww = Math.max(2, d.w * w);
    ctx.beginPath();
    ctx.moveTo(x - ww / 2, y);
    ctx.lineTo(x + ww / 2, y);
    ctx.lineTo(x + ww / 3, y + len);
    ctx.arc(x, y + len, ww / 3, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  }
  for (const b of s.blobs) {
    const r = b.r * Math.min(w, h);
    const g = ctx.createRadialGradient(b.x * w, b.y * h, r * 0.2, b.x * w, b.y * h, r);
    g.addColorStop(0, dark);
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x * w, b.y * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = color;
  for (const d of s.drops) {
    ctx.beginPath();
    ctx.arc(d.x * w, d.y * h, Math.max(1, d.r * Math.min(w, h)), 0, Math.PI * 2);
    ctx.fill();
  }
}
