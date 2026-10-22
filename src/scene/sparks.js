import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  PointsMaterial,
} from 'three';

/**
 * One pooled Points cloud for arcade sparks (safe click, hit, round win).
 * Single draw call, fixed buffer, no per-burst allocation.
 */
export function createSparks({ count = 72 } = {}) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('color', new BufferAttribute(col, 3));
  const mat = new PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  points.visible = false;
  const tint = new Color();
  let next = 0;
  let alive = 0;

  for (let i = 0; i < count; i += 1) pos[i * 3 + 1] = -10;

  return {
    root: points,
    burst(origin, color, n = 24, speed = 1.6) {
      tint.setHex(color);
      for (let k = 0; k < n; k += 1) {
        const i = next;
        next = (next + 1) % count;
        const a = Math.random() * Math.PI * 2;
        const up = 0.4 + Math.random() * 0.9;
        const s = speed * (0.45 + Math.random() * 0.75);
        pos[i * 3] = origin.x;
        pos[i * 3 + 1] = origin.y;
        pos[i * 3 + 2] = origin.z;
        vel[i * 3] = Math.cos(a) * s;
        vel[i * 3 + 1] = up * s;
        vel[i * 3 + 2] = Math.sin(a) * s * 0.7 + 0.35;
        life[i] = 0.55 + Math.random() * 0.45;
        const v = 0.75 + Math.random() * 0.25;
        col[i * 3] = tint.r * v;
        col[i * 3 + 1] = tint.g * v;
        col[i * 3 + 2] = tint.b * v;
      }
      alive = count;
      points.visible = true;
    },
    update(dt) {
      if (!points.visible) return;
      let live = 0;
      for (let i = 0; i < count; i += 1) {
        if (life[i] <= 0) continue;
        life[i] -= dt;
        if (life[i] <= 0) {
          pos[i * 3 + 1] = -10;
          continue;
        }
        live += 1;
        vel[i * 3 + 1] -= 4.2 * dt;
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        // Bounce off the felt so sparks skitter instead of falling through.
        if (pos[i * 3 + 1] < 0.85 && vel[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 0.85;
          vel[i * 3 + 1] *= -0.35;
          vel[i * 3] *= 0.6;
          vel[i * 3 + 2] *= 0.6;
        }
        const fade = Math.min(1, life[i] * 2.5);
        col[i * 3] *= 0.985 + 0.015 * fade;
        col[i * 3 + 1] *= 0.985 + 0.015 * fade;
        col[i * 3 + 2] *= 0.985 + 0.015 * fade;
      }
      alive = live;
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      if (!alive) points.visible = false;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
