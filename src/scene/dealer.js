import { Group, Mesh, MeshBasicMaterial } from 'three';

/**
 * HOUSE — a faceless figure in a dark suit and fedora across the table.
 * Face stays in the hat's shadow; two faint eye glints are the only tell.
 * Cheap primitives, no likeness of anyone.
 */
export function createDealer(mats, geo) {
  const root = new Group();
  root.position.set(0, 0.0, -0.92);

  const torso = new Mesh(geo.box(0.72, 0.8, 0.38), mats.body);
  torso.position.set(0, 1.16, 0);
  root.add(torso);
  const shirt = new Mesh(geo.box(0.16, 0.42, 0.02), mats.shirt);
  shirt.position.set(0, 1.34, 0.195);
  root.add(shirt);
  const tie = new Mesh(geo.box(0.05, 0.34, 0.02), mats.accent);
  tie.position.set(0, 1.32, 0.21);
  root.add(tie);
  const lapelGeo = geo.box(0.12, 0.4, 0.02);
  for (const side of [-1, 1]) {
    const lapel = new Mesh(lapelGeo, mats.accent);
    lapel.position.set(side * 0.13, 1.35, 0.2);
    lapel.rotation.z = side * 0.22;
    root.add(lapel);
  }

  const head = new Group();
  head.position.set(0, 1.82, 0.04);
  root.add(head);
  const neck = new Mesh(geo.box(0.14, 0.12, 0.14), mats.face);
  neck.position.set(0, -0.2, 0);
  head.add(neck);
  const skull = new Mesh(geo.box(0.3, 0.34, 0.3), mats.face);
  head.add(skull);
  // Fedora: brim + crown + band.
  const brim = new Mesh(geo.cylinder(0.3, 0.3, 0.025, 20), mats.accent);
  brim.position.set(0, 0.15, 0.02);
  brim.rotation.x = 0.12;
  head.add(brim);
  const crown = new Mesh(geo.cylinder(0.16, 0.19, 0.2, 16), mats.body);
  crown.position.set(0, 0.26, 0.01);
  head.add(crown);
  const band = new Mesh(geo.cylinder(0.192, 0.192, 0.04, 16), mats.accent);
  band.position.set(0, 0.18, 0.01);
  head.add(band);

  // Eye glints double as the tell (amber flicker when HOUSE knows it's live).
  const eyeMat = new MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0.4 });
  const eyeGeo = geo.box(0.045, 0.014, 0.01);
  for (const side of [-1, 1]) {
    const eye = new Mesh(eyeGeo, eyeMat);
    eye.position.set(side * 0.07, 0.03, 0.155);
    head.add(eye);
  }

  const armL = makeArm(mats, geo, -1);
  const armR = makeArm(mats, geo, 1);
  root.add(armL.root, armR.root);

  let mood = 'idle';
  let tell = false;
  let aim = false;
  let t = 0;
  let shake = 0;
  let nod = 0;
  let down = 0;

  return {
    root,
    setMood(next) {
      mood = next;
      if (next === 'bang') shake = 1;
      if (next === 'click') nod = 1;
    },
    headPos(out) {
      return head.getWorldPosition(out);
    },
    setTell(on) {
      tell = Boolean(on);
    },
    /** Raise the right hand (our left) to the temple with the revolver. */
    setAim(on) {
      aim = Boolean(on);
    },
    update(dt, reducedMotion = false) {
      t += dt;
      shake = Math.max(0, shake - dt * 2.2);
      nod = Math.max(0, nod - dt * 1.8);
      // 'out': HOUSE took the round on the chin and slumps over the table.
      const wantDown = mood === 'out' ? 1 : 0;
      down += (wantDown - down) * Math.min(1, dt * (reducedMotion ? 20 : wantDown ? 5 : 2));
      const breathe = reducedMotion || down > 0.5 ? 0 : Math.sin(t * 1.4) * 0.01;
      torso.position.y = 1.16 + breathe;
      head.position.y = 1.82 + breathe * 1.4 - down * 0.12;

      const lean = mood === 'think' || mood === 'pull' ? 0.12 : mood === 'win' ? -0.06 : 0.03;
      const wantLean = lean + down * 0.42;
      root.rotation.x += (wantLean - root.rotation.x) * Math.min(1, dt * (reducedMotion ? 12 : 4));

      head.rotation.x = (reducedMotion ? 0 : Math.sin(t * 0.6) * 0.03) - nod * 0.22 + down * 0.7;
      const idleY = reducedMotion || aim ? 0 : Math.sin(t * 0.45) * 0.07;
      if (shake > 0 && !reducedMotion) {
        head.rotation.y = idleY + (Math.random() - 0.5) * shake * 0.04;
        head.rotation.z = (Math.random() - 0.5) * shake * 0.18 + down * 0.2;
      } else {
        head.rotation.y = idleY;
        head.rotation.z = down * 0.2;
      }

      if (tell) {
        eyeMat.color.setHex(0xffa630);
        eyeMat.opacity = reducedMotion ? 0.9 : 0.4 + Math.abs(Math.sin(t * 12)) * 0.6;
      } else {
        eyeMat.color.setHex(0xffe2a8);
        eyeMat.opacity = down > 0.3 ? 0 : reducedMotion ? 0.4 : 0.3 + Math.sin(t * 2.2) * 0.1;
      }

      const k = Math.min(1, dt * 5);
      const raise = aim && down < 0.3;
      // Our-left arm lifts out and up so the hand sits by the temple.
      armL.root.rotation.z += ((raise ? -2.35 : 0) - armL.root.rotation.z) * k;
      armL.root.rotation.x += ((raise ? -0.25 : 0) - armL.root.rotation.x) * k;
      armL.fore.rotation.x += ((raise ? -0.2 : -0.52 - down * 0.4) - armL.fore.rotation.x) * k;
      armL.fore.rotation.z += ((raise ? 1.9 : 0) - armL.fore.rotation.z) * k;
      const reach = mood === 'pull' ? 0.3 : 0.12;
      armR.fore.rotation.x += (-0.4 - reach - down * 0.5 - armR.fore.rotation.x) * k;
    },
    dispose() {
      eyeMat.dispose();
    },
  };
}

function makeArm(mats, geo, side) {
  const root = new Group();
  root.position.set(side * 0.42, 1.48, 0.02);
  const upper = new Mesh(geo.box(0.14, 0.4, 0.14), mats.body);
  upper.position.set(0, -0.18, 0);
  root.add(upper);
  const fore = new Group();
  fore.position.set(0, -0.38, 0);
  root.add(fore);
  const beam = new Mesh(geo.box(0.12, 0.34, 0.12), mats.body);
  beam.position.set(0, -0.16, 0.04);
  fore.add(beam);
  const cuff = new Mesh(geo.box(0.125, 0.04, 0.125), mats.shirt);
  cuff.position.set(0, -0.33, 0.04);
  fore.add(cuff);
  const hand = new Mesh(geo.box(0.1, 0.1, 0.12), mats.face);
  hand.position.set(0, -0.4, 0.06);
  fore.add(hand);
  return { root, fore };
}
