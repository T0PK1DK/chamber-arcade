import { Group, Mesh, MeshBasicMaterial } from 'three';

/**
 * HOUSE — a CRT-visor robot sitting across the table.
 * Cartoon proportions, no horror face, cheap primitives.
 */
export function createDealer(mats, geo) {
  const root = new Group();
  root.position.set(0, 0.0, -0.92);

  const torso = new Mesh(geo.box(0.7, 0.78, 0.4), mats.body);
  torso.position.set(0, 1.16, 0);
  root.add(torso);

  const collar = new Mesh(geo.box(0.78, 0.1, 0.44), mats.accent);
  collar.position.set(0, 1.56, 0);
  root.add(collar);

  const head = new Group();
  head.position.set(0, 1.88, 0.06);
  root.add(head);

  const skull = new Mesh(geo.box(0.48, 0.4, 0.36), mats.body);
  head.add(skull);

  const visor = new Mesh(geo.box(0.4, 0.18, 0.07), mats.visor);
  visor.position.set(0, 0.03, 0.18);
  head.add(visor);
  const visorMat = new MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.22 });
  const visorGlow = new Mesh(geo.plane(0.46, 0.24), visorMat);
  visorGlow.position.set(0, 0.03, 0.2);
  head.add(visorGlow);

  const antenna = new Mesh(geo.cylinder(0.015, 0.015, 0.22, 6), mats.metal);
  antenna.position.set(0.14, 0.28, 0);
  head.add(antenna);
  const bead = new Mesh(geo.sphere(0.03, 8, 8), mats.neon);
  bead.position.set(0.14, 0.4, 0);
  head.add(bead);

  const armL = makeArm(mats, geo, -1);
  const armR = makeArm(mats, geo, 1);
  root.add(armL.root, armR.root);

  let mood = 'idle';
  let tell = false;
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
    setTell(on) {
      tell = Boolean(on);
    },
    update(dt, reducedMotion = false) {
      t += dt;
      shake = Math.max(0, shake - dt * 2.2);
      nod = Math.max(0, nod - dt * 1.8);
      const breathe = reducedMotion ? 0 : Math.sin(t * 1.6) * 0.012;
      torso.position.y = 1.16 + breathe;
      head.position.y = 1.88 + breathe * 1.4;

      const lean = mood === 'think' || mood === 'pull' ? 0.18 : mood === 'win' ? -0.06 : 0.04;
      root.rotation.x += (lean - root.rotation.x) * Math.min(1, dt * (reducedMotion ? 12 : 4));

      head.rotation.x = (reducedMotion ? 0 : Math.sin(t * 0.7) * 0.04) - nod * 0.25;
      const idleY = reducedMotion ? 0 : Math.sin(t * 0.5) * 0.08;
      if (shake > 0 && !reducedMotion) {
        head.rotation.y = idleY + (Math.random() - 0.5) * shake * 0.04;
        head.rotation.z = (Math.random() - 0.5) * shake * 0.2;
      } else {
        head.rotation.y = idleY;
        head.rotation.z = 0;
      }

      if (tell) {
        visorMat.color.setHex(0xff8a2a);
        visorMat.opacity = reducedMotion ? 0.7 : 0.28 + Math.abs(Math.sin(t * 14)) * 0.5;
      } else {
        visorMat.color.setHex(0x39ff14);
        visorMat.opacity = mood === 'bang'
          ? 0.08
          : (reducedMotion ? 0.22 : 0.18 + Math.sin(t * 3) * 0.08);
      }

      const reach = mood === 'pull' ? 0.35 : 0.12;
      armL.fore.rotation.x += (-0.4 - reach - armL.fore.rotation.x) * Math.min(1, dt * 5);
      armR.fore.rotation.x += (-0.4 - reach - armR.fore.rotation.x) * Math.min(1, dt * 5);
    },
    dispose() {
      visorMat.dispose();
    },
  };
}

function makeArm(mats, geo, side) {
  const root = new Group();
  root.position.set(side * 0.42, 1.38, 0.02);
  const upper = new Mesh(geo.box(0.12, 0.36, 0.12), mats.accent);
  upper.position.set(0, -0.16, 0);
  root.add(upper);
  const fore = new Group();
  fore.position.set(0, -0.36, 0);
  root.add(fore);
  const beam = new Mesh(geo.box(0.1, 0.34, 0.1), mats.body);
  beam.position.set(0, -0.16, 0.04);
  fore.add(beam);
  const hand = new Mesh(geo.box(0.12, 0.1, 0.14), mats.metal);
  hand.position.set(0, -0.36, 0.08);
  fore.add(hand);
  return { root, fore };
}
