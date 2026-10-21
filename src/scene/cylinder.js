import { Group, Mesh, MeshBasicMaterial } from 'three';
import { CHAMBERS } from '../game/logic.js';
import { shortestAngle } from '../game/math.js';

const STEP = (Math.PI * 2) / CHAMBERS;

/**
 * Toy chamber drum. Six holes face the player. Not a firearm — a neon arcade widget.
 */
export function createCylinder(mats, geo) {
  const root = new Group();
  root.position.set(0, 1.02, 0.28);
  root.rotation.x = -0.95;

  const frame = new Mesh(geo.cylinder(0.4, 0.42, 0.1, 16), mats.darkMetal);
  frame.rotation.x = Math.PI / 2;
  root.add(frame);

  const drum = new Group();
  root.add(drum);

  const body = new Mesh(geo.cylinder(0.34, 0.34, 0.22, 22), mats.brass);
  body.rotation.x = Math.PI / 2;
  drum.add(body);

  const hub = new Mesh(geo.cylinder(0.09, 0.09, 0.24, 12), mats.metal);
  hub.rotation.x = Math.PI / 2;
  drum.add(hub);

  const sleeveGeo = geo.cylinder(0.06, 0.06, 0.26, 10);
  const wellGeo = geo.circle(0.048, 12);
  const holes = [];
  for (let i = 0; i < CHAMBERS; i += 1) {
    const a = Math.PI / 2 + i * STEP;
    const x = Math.cos(a) * 0.2;
    const y = Math.sin(a) * 0.2;
    const sleeve = new Mesh(sleeveGeo, mats.darkMetal);
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.set(x, y, 0);
    drum.add(sleeve);

    // Sit just proud of the sleeve cap (z 0.13) so the current / live colour shows.
    const well = new Mesh(wellGeo, mats.hole);
    well.position.set(x, y, 0.132);
    drum.add(well);
    holes.push(well);
  }

  const marker = new Mesh(geo.box(0.05, 0.03, 0.08), mats.neon);
  marker.position.set(0, 0.42, 0.04);
  root.add(marker);

  const fireMat = new MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.95 });
  const fireGlow = new Mesh(geo.ring(0.05, 0.078, 18), fireMat);
  fireGlow.position.set(0, 0.2, 0.136);
  fireGlow.visible = false;
  root.add(fireGlow);

  const plaque = new Mesh(geo.box(0.42, 0.04, 0.12), mats.metal);
  plaque.position.set(0, -0.22, -0.02);
  root.add(plaque);

  const baseRotX = root.rotation.x;
  let spinVel = 0;
  let target = 0;
  let spinning = false;
  let pulse = 0;
  let onLand = null;

  function angleFor(index) {
    return -index * STEP;
  }

  return {
    root,
    /** World-space point at the firing hole, for sparks. */
    muzzle(out) {
      return fireGlow.getWorldPosition(out);
    },
    onLand(fn) {
      onLand = fn;
    },
    kickSpin() {
      spinning = true;
      spinVel = 18;
    },
    land(index) {
      target = angleFor(index);
      spinning = true;
      spinVel = 14;
    },
    setIndex(index, instant) {
      target = angleFor(index);
      if (instant) {
        drum.rotation.z = target;
        spinning = false;
        spinVel = 0;
      } else {
        // Ease one notch to the next chamber (was a no-op: target moved, drum did not).
        spinning = true;
        spinVel = Math.max(spinVel, 0);
      }
    },
    paint({ spun, over, current, bullet, peek, reveal }) {
      fireGlow.visible = Boolean(spun && !over);
      fireMat.color.setHex(peek === 'live' ? 0xff8a2a : 0x39ff14);
      holes.forEach((well, i) => {
        if (reveal && i === bullet) well.material = mats.holeLive;
        else if (spun && !over && i === current && peek === 'live') well.material = mats.holeLive;
        else if (spun && !over && i === current) well.material = mats.holeCurrent;
        else well.material = mats.hole;
      });
    },
    update(dt, reducedMotion = false, punch = 0) {
      pulse += dt;
      if (fireGlow.visible) {
        fireMat.opacity = reducedMotion ? 0.85 : 0.55 + Math.sin(pulse * 7) * 0.35;
      }
      // Punch: a quick squash-pop and a recoil tilt toward the player.
      const s = 1 + punch * 0.07;
      root.scale.set(s, s, 1 - punch * 0.05);
      root.rotation.x = baseRotX - punch * 0.12;
      if (!spinning) return;
      if (reducedMotion) {
        drum.rotation.z = target;
        spinning = false;
        spinVel = 0;
        return;
      }
      drum.rotation.z += spinVel * dt;
      spinVel *= Math.exp(-2.4 * dt);
      if (spinVel < 3.2) {
        const err = shortestAngle(drum.rotation.z, target);
        drum.rotation.z += err * Math.min(1, 8 * dt);
        if (Math.abs(err) < 0.02 && spinVel < 0.4) {
          drum.rotation.z = target;
          spinning = false;
          if (onLand) onLand();
        }
      }
    },
    dispose() {
      fireMat.dispose();
    },
  };
}
