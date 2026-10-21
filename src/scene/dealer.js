import * as THREE from 'three';

/**
 * HOUSE — a CRT-visor robot sitting across the table.
 * Cartoon proportions, no horror face, cheap primitives.
 */
export function createDealer(mats) {
  const root = new THREE.Group();
  root.position.set(0, 0.0, -0.92);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.78, 0.4), mats.body);
  torso.position.set(0, 1.16, 0);
  root.add(torso);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.1, 0.44), mats.accent);
  collar.position.set(0, 1.56, 0);
  root.add(collar);

  const head = new THREE.Group();
  head.position.set(0, 1.88, 0.06);
  root.add(head);

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.36), mats.body);
  head.add(skull);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.07), mats.visor);
  visor.position.set(0, 0.03, 0.18);
  head.add(visor);
  const visorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.24),
    new THREE.MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.22 }),
  );
  visorGlow.position.set(0, 0.03, 0.2);
  head.add(visorGlow);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), mats.metal);
  antenna.position.set(0.14, 0.28, 0);
  head.add(antenna);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), mats.neon);
  bead.position.set(0.14, 0.4, 0);
  head.add(bead);

  const armL = makeArm(mats, -1);
  const armR = makeArm(mats, 1);
  root.add(armL.root, armR.root);

  let mood = 'idle';
  let t = 0;
  let shake = 0;
  let nod = 0;

  return {
    root,
    setMood(next) {
      mood = next;
      if (next === 'bang') shake = 1;
      if (next === 'click') nod = 1;
    },
    update(dt) {
      t += dt;
      shake = Math.max(0, shake - dt * 2.2);
      nod = Math.max(0, nod - dt * 1.8);
      const breathe = Math.sin(t * 1.6) * 0.012;
      torso.position.y = 1.16 + breathe;
      head.position.y = 1.88 + breathe * 1.4;

      const lean = mood === 'think' || mood === 'pull' ? 0.18 : mood === 'win' ? -0.06 : 0.04;
      root.rotation.x += (lean - root.rotation.x) * Math.min(1, dt * 4);

      head.rotation.x = Math.sin(t * 0.7) * 0.04 - nod * 0.25;
      head.rotation.y = Math.sin(t * 0.5) * 0.08 + (Math.random() - 0.5) * shake * 0.04;
      head.rotation.z = (Math.random() - 0.5) * shake * 0.2;

      visorGlow.material.opacity = mood === 'bang'
        ? 0.08
        : 0.18 + Math.sin(t * 3) * 0.08;

      const reach = mood === 'pull' ? 0.35 : 0.12;
      armL.fore.rotation.x += (-0.4 - reach - armL.fore.rotation.x) * Math.min(1, dt * 5);
      armR.fore.rotation.x += (-0.4 - reach - armR.fore.rotation.x) * Math.min(1, dt * 5);
    },
  };
}

function makeArm(mats, side) {
  const root = new THREE.Group();
  root.position.set(side * 0.42, 1.38, 0.02);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), mats.accent);
  upper.position.set(0, -0.16, 0);
  root.add(upper);
  const fore = new THREE.Group();
  fore.position.set(0, -0.36, 0);
  root.add(fore);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.1), mats.body);
  beam.position.set(0, -0.16, 0.04);
  fore.add(beam);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.14), mats.metal);
  hand.position.set(0, -0.36, 0.08);
  fore.add(hand);
  return { root, fore };
}
