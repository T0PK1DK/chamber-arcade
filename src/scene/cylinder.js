import * as THREE from 'three';
import { CHAMBERS } from '../game/logic.js';

const STEP = (Math.PI * 2) / CHAMBERS;

/**
 * Toy chamber drum. Six holes face the player. Not a firearm — a neon arcade widget.
 */
export function createCylinder(mats) {
  const root = new THREE.Group();
  root.position.set(0, 0.98, 0.22);
  root.rotation.x = -0.72;

  const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.08, 16), mats.darkMetal);
  frame.rotation.x = Math.PI / 2;
  root.add(frame);

  const drum = new THREE.Group();
  root.add(drum);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 20), mats.brass);
  body.rotation.x = Math.PI / 2;
  drum.add(body);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12), mats.metal);
  hub.rotation.x = Math.PI / 2;
  drum.add(hub);

  const holes = [];
  for (let i = 0; i < CHAMBERS; i += 1) {
    const a = -Math.PI / 2 + i * STEP;
    const x = Math.cos(a) * 0.18;
    const y = Math.sin(a) * 0.18;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.2, 10), mats.darkMetal);
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.set(x, y, 0);
    drum.add(sleeve);

    const well = new THREE.Mesh(new THREE.CircleGeometry(0.042, 12), mats.hole);
    well.position.set(x, y, 0.085);
    drum.add(well);
    holes.push(well);
  }

  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.06), mats.neon);
  marker.position.set(0, 0.34, 0.02);
  root.add(marker);

  const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.12), mats.metal);
  plaque.position.set(0, -0.22, -0.02);
  root.add(plaque);

  let spinVel = 0;
  let target = 0;
  let spinning = false;

  function angleFor(index) {
    return -index * STEP;
  }

  return {
    root,
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
      }
    },
    paint({ spun, over, current, bullet, peek, reveal }) {
      holes.forEach((well, i) => {
        if (reveal && i === bullet) well.material = mats.holeLive;
        else if (spun && !over && i === current && peek === 'live') well.material = mats.holeLive;
        else if (spun && !over && i === current) well.material = mats.holeCurrent;
        else well.material = mats.hole;
      });
    },
    update(dt) {
      if (!spinning) return;
      drum.rotation.z += spinVel * dt;
      spinVel *= Math.exp(-2.4 * dt);
      if (spinVel < 3.2) {
        const err = shortest(drum.rotation.z, target);
        drum.rotation.z += err * Math.min(1, 8 * dt);
        if (Math.abs(err) < 0.02 && spinVel < 0.4) {
          drum.rotation.z = target;
          spinning = false;
        }
      }
    },
  };
}

function shortest(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
