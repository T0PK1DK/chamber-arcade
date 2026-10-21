import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { makeSplatter, paintSplatter } from '../game/splatter.js';

const FELT_Y = 0.845;

function canvasTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  draw(c.getContext('2d'), size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return { tex: t, canvas: c };
}

/**
 * Gunshot effects: muzzle flash, barrel smoke, and (when blood is on) the
 * spray, wall / felt spatter and a spreading pool under HOUSE.
 * Everything is pooled and built once; clear() resets between rounds.
 */
export function createFx({ quality }) {
  const group = [];
  const disposables = [];

  // Muzzle flash: a hot star billboard for ~70 ms.
  const flash = canvasTex(128, (g, s) => {
    const r = s / 2;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, 'rgba(255,255,230,1)');
    grad.addColorStop(0.25, 'rgba(255,200,90,0.95)');
    grad.addColorStop(0.6, 'rgba(255,110,20,0.35)');
    grad.addColorStop(1, 'rgba(255,80,0,0)');
    g.fillStyle = grad;
    g.beginPath();
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2;
      const d = i % 2 ? r * 0.38 : r;
      g.lineTo(r + Math.cos(a) * d, r + Math.sin(a) * d);
    }
    g.closePath();
    g.fill();
  });
  const flashMat = new SpriteMaterial({ map: flash.tex, blending: AdditiveBlending, depthWrite: false, transparent: true });
  const flashSprite = new Sprite(flashMat);
  flashSprite.visible = false;
  group.push(flashSprite);
  disposables.push(flash.tex, flashMat);
  let flashT = 0;

  // Smoke: a handful of soft sprites that rise, swell and thin out.
  const puff = canvasTex(64, (g, s) => {
    const r = s / 2;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, 'rgba(200,195,185,0.55)');
    grad.addColorStop(1, 'rgba(200,195,185,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  });
  disposables.push(puff.tex);
  const smoke = [];
  const SMOKE = quality.mobile ? 6 : 10;
  for (let i = 0; i < SMOKE; i += 1) {
    const m = new SpriteMaterial({ map: puff.tex, transparent: true, depthWrite: false, opacity: 0 });
    const sp = new Sprite(m);
    sp.visible = false;
    group.push(sp);
    disposables.push(m);
    smoke.push({ sp, m, v: new Vector3(), life: 0, max: 1 });
  }

  // Blood spray: pooled droplets with gravity that stick where they land.
  const N = quality.mobile ? 90 : 160;
  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  const stuck = new Uint8Array(N);
  for (let i = 0; i < N; i += 1) pos[i * 3 + 1] = -10;
  const dropGeo = new BufferGeometry();
  dropGeo.setAttribute('position', new BufferAttribute(pos, 3));
  const dropMat = new PointsMaterial({ color: 0x7a0606, size: 0.022, sizeAttenuation: true, depthWrite: false });
  const drops = new Points(dropGeo, dropMat);
  drops.frustumCulled = false;
  drops.visible = false;
  group.push(drops);
  disposables.push(dropGeo, dropMat);
  let dropsLive = false;

  // Spatter decals: one on the wall behind HOUSE, one on the felt.
  function decal(w, h, size) {
    const { tex, canvas } = canvasTex(size, () => {});
    const mat = new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const mesh = new Mesh(new PlaneGeometry(w, h), mat);
    mesh.visible = false;
    group.push(mesh);
    disposables.push(tex, mat, mesh.geometry);
    return { mesh, tex, canvas };
  }
  const wall = decal(2.4, 2.4, 512);
  wall.mesh.position.set(1.05, 2.0, -3.97);
  const felt = decal(0.9, 0.9, 256);
  felt.mesh.rotation.x = -Math.PI / 2;
  felt.mesh.position.set(0.22, FELT_Y, -0.45);

  // Pool under HOUSE's head once it slumps.
  const poolMat = new MeshBasicMaterial({ color: 0x4a0303, transparent: true, opacity: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
  const pool = new Mesh(new CircleGeometry(0.5, 28), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.04, FELT_Y + 0.001, -0.5);
  pool.scale.set(0.001, 0.001, 1);
  pool.visible = false;
  group.push(pool);
  disposables.push(poolMat, pool.geometry);
  let poolGrow = 0;
  let poolWait = 0;

  function paint(target, opts) {
    const g = target.canvas.getContext('2d');
    g.clearRect(0, 0, target.canvas.width, target.canvas.height);
    paintSplatter(g, target.canvas.width, target.canvas.height, makeSplatter(Math.random, opts), '#7a0808', '#3c0303');
    target.tex.needsUpdate = true;
    target.mesh.visible = true;
  }

  const tmp = new Vector3();

  return {
    objects: group,
    /** A live round fired from `muzzle` along `dir`. */
    shot(muzzle, dir, { calm = false } = {}) {
      flashSprite.position.copy(muzzle).addScaledVector(dir, 0.06);
      flashSprite.scale.setScalar(0.32 + Math.random() * 0.12);
      flashMat.rotation = Math.random() * Math.PI;
      flashSprite.visible = true;
      flashT = 0.07;
      if (calm) return;
      smoke.forEach((s, i) => {
        s.sp.position.copy(muzzle).addScaledVector(dir, 0.03 * i);
        s.v.set((Math.random() - 0.5) * 0.15, 0.18 + Math.random() * 0.15, (Math.random() - 0.5) * 0.15)
          .addScaledVector(dir, 0.25);
        s.max = 1.6 + Math.random() * 1.2;
        s.life = s.max;
        s.sp.scale.setScalar(0.08);
        s.sp.visible = true;
      });
    },
    /** Blood out the far side of HOUSE's head; spatter + pool follow. */
    blood(exit, dir) {
      for (let i = 0; i < N; i += 1) {
        const s = 1.2 + Math.random() * 2.6;
        tmp.set(
          dir.x + (Math.random() - 0.5) * 0.9,
          dir.y + (Math.random() - 0.2) * 0.9,
          dir.z + (Math.random() - 0.5) * 0.9,
        ).normalize();
        pos[i * 3] = exit.x;
        pos[i * 3 + 1] = exit.y;
        pos[i * 3 + 2] = exit.z;
        vel[i * 3] = tmp.x * s;
        vel[i * 3 + 1] = tmp.y * s;
        vel[i * 3 + 2] = tmp.z * s;
        stuck[i] = 0;
      }
      drops.visible = true;
      dropsLive = true;
      paint(wall, { cx: 0.3, cy: 0.45, angle: 0, spread: 1.6, reach: 0.55, drops: 70, blobs: 6, drips: 5 });
      paint(felt, { cx: 0.35, cy: 0.5, angle: 0.2, spread: 2.2, reach: 0.45, drops: 40, blobs: 4, drips: 0 });
      pool.visible = true;
      pool.scale.set(0.001, 0.001, 1);
      poolWait = 0.9;
      poolGrow = 1;
    },
    update(dt) {
      if (flashT > 0) {
        flashT -= dt;
        if (flashT <= 0) flashSprite.visible = false;
      }
      for (const s of smoke) {
        if (s.life <= 0) continue;
        s.life -= dt;
        if (s.life <= 0) {
          s.sp.visible = false;
          continue;
        }
        const t = 1 - s.life / s.max;
        s.sp.position.addScaledVector(s.v, dt);
        s.v.multiplyScalar(1 - dt * 0.6);
        s.sp.scale.setScalar(0.08 + t * 0.5);
        s.m.opacity = (1 - t) * 0.55;
      }
      if (dropsLive) {
        let moving = 0;
        for (let i = 0; i < N; i += 1) {
          if (stuck[i]) continue;
          vel[i * 3 + 1] -= 9.8 * dt;
          pos[i * 3] += vel[i * 3] * dt;
          pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
          pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
          const onTable = Math.abs(pos[i * 3]) < 1.12 && pos[i * 3 + 2] > -0.72 && pos[i * 3 + 2] < 0.62;
          const floor = onTable ? FELT_Y : 0.01;
          if (pos[i * 3 + 1] <= floor) {
            pos[i * 3 + 1] = floor + 0.002;
            stuck[i] = 1;
          } else {
            moving += 1;
          }
        }
        dropGeo.attributes.position.needsUpdate = true;
        if (!moving) dropsLive = false;
      }
      if (poolGrow > 0) {
        if (poolWait > 0) {
          poolWait -= dt;
        } else {
          const cur = pool.scale.x;
          const next = cur + (0.62 - cur) * Math.min(1, dt * 0.35);
          pool.scale.set(next, next * 0.8, 1);
          if (next > 0.6) poolGrow = 0;
        }
      }
    },
    clear() {
      flashSprite.visible = false;
      flashT = 0;
      for (const s of smoke) {
        s.life = 0;
        s.sp.visible = false;
      }
      drops.visible = false;
      dropsLive = false;
      for (let i = 0; i < N; i += 1) pos[i * 3 + 1] = -10;
      dropGeo.attributes.position.needsUpdate = true;
      wall.mesh.visible = false;
      felt.mesh.visible = false;
      pool.visible = false;
      poolGrow = 0;
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
