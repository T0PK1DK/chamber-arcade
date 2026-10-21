import * as THREE from 'three';
import { CHAMBERS } from '../game/logic.js';

const STEP = (Math.PI * 2) / CHAMBERS;

/**
 * Toy chamber drum. Six holes face the player. Not a firearm — a neon arcade widget.
 */
export function createCylinder(mats) {
  const root = new THREE.Group();
  root.position.set(0, 1.02, 0.28);
  root.rotation.x = -0.95;

  const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.1, 16), mats.darkMetal);
  frame.rotation.x = Math.PI / 2;
  root.add(frame);

  const drum = new THREE.Group();
  root.add(drum);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 22), mats.brass);
  body.rotation.x = Math.PI / 2;
  drum.add(body);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.24, 12), mats.metal);
  hub.rotation.x = Math.PI / 2;
  drum.add(hub);

  const holes = [];
  for (let i = 0; i < CHAMBERS; i += 1) {
    const a = Math.PI / 2 + i * STEP;
    const x = Math.cos(a) * 0.2;
    const y = Math.sin(a) * 0.2;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 10), mats.darkMetal);
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.set(x, y, 0);
    drum.add(sleeve);

    const well = new THREE.Mesh(new THREE.CircleGeometry(0.048, 12), mats.hole);
    well.position.set(x, y, 0.12);
    drum.add(well);
    holes.push(well);
  }

  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.08), mats.neon);
  marker.position.set(0, 0.42, 0.04);
  root.add(marker);

  const fireGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.078, 18),
    new THREE.MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.95 }),
  );
  fireGlow.position.set(0, 0.2, 0.13);
  fireGlow.visible = false;
  root.add(fireGlow);

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
      fireGlow.visible = Boolean(spun && !over);
      fireGlow.material.color.setHex(peek === 'live' ? 0xff8a2a : 0x39ff14);
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
