import { Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, Color } from 'three';
import { CAST } from '../game/characters.js';

/**
 * The opponent: a seated person built from primitives, dressed from a
 * cast entry (src/game/characters.js). setLook() swaps the person between
 * matches. Moods: idle / think / pull / click / win, 'out' (slumps forward
 * after their own shot) and 'shot' (knocked back in the chair when you hit
 * them). setAim('temple' | 'you' | false) raises the gun arm.
 */
export function createDealer(mats, geo) {
  const root = new Group();
  root.position.set(0, 0, -0.92);
  const body = new Group();
  root.add(body);

  let built = [];
  let looks = [];
  const irisMat = new MeshBasicMaterial({ color: 0x1a120c });
  const glintMat = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });

  let head = new Group();
  let armL = null;
  let armR = null;

  function mat(color) {
    const m = new MeshLambertMaterial({ color });
    looks.push(m);
    return m;
  }
  function add(parent, g, m, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    const mesh = new Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.rotation.set(rx, ry, rz);
    parent.add(mesh);
    return mesh;
  }

  function build(c) {
    built.forEach((o) => o.parent && o.parent.remove(o));
    looks.forEach((m) => m.dispose());
    built = [];
    looks = [];

    const skin = mat(c.skin);
    const skinDark = mat(new Color(c.skin).multiplyScalar(0.72).getHex());
    const lip = mat(new Color(c.skin).lerp(new Color(0x8a3a32), 0.35).getHex());
    const hair = mat(c.hair);
    const suit = mat(c.suit);
    const lapel = mat(new Color(c.suit).multiplyScalar(0.7).getHex());
    const shirt = mat(c.shirt);
    const tie = mat(c.tie);
    const white = mat(0xf2ede4);
    const frame = mat(0x1a1714);

    const torso = new Group();
    body.add(torso);
    built.push(torso);
    // Rounded torso: a tapered cylinder squashed front-to-back.
    add(torso, geo.cylinder(0.25, 0.21, 0.62, 14), suit, 0, 1.2, 0, 1, 1, 0.62);
    add(torso, geo.sphere(0.085, 10, 8), suit, -0.24, 1.47, 0, 1, 0.8, 0.9);
    add(torso, geo.sphere(0.085, 10, 8), suit, 0.24, 1.47, 0, 1, 0.8, 0.9);
    add(torso, geo.box(0.11, 0.26, 0.02), shirt, 0, 1.38, 0.148);
    add(torso, geo.box(0.04, 0.24, 0.012), tie, 0, 1.34, 0.158);
    add(torso, geo.box(0.05, 0.035, 0.015), tie, 0, 1.475, 0.16);
    add(torso, geo.box(0.07, 0.3, 0.015), lapel, -0.07, 1.38, 0.152, 1, 1, 1, 0, 0, -0.32);
    add(torso, geo.box(0.07, 0.3, 0.015), lapel, 0.07, 1.38, 0.152, 1, 1, 1, 0, 0, 0.32);
    add(torso, geo.cylinder(0.05, 0.055, 0.1, 10), skin, 0, 1.55, 0.0);
    add(torso, geo.cylinder(0.062, 0.062, 0.035, 12), shirt, 0, 1.51, 0.0);

    head = new Group();
    head.position.set(0, 1.72, 0.01);
    body.add(head);
    built.push(head);
    // Skull + jaw, nose, ears.
    add(head, geo.sphere(0.12, 18, 14), skin, 0, 0, 0, 0.9, 1.1, 1.0);
    add(head, geo.sphere(0.1, 14, 10), skin, 0, -0.065, 0.018, 0.85, 0.65, 0.92);
    add(head, geo.box(0.032, 0.06, 0.04), skin, 0, -0.005, 0.112, 1, 1, 1, -0.15);
    add(head, geo.sphere(0.02, 8, 6), skin, 0, -0.032, 0.128);
    add(head, geo.sphere(0.03, 8, 6), skinDark, -0.108, 0, -0.005, 0.45, 1, 0.8);
    add(head, geo.sphere(0.03, 8, 6), skinDark, 0.108, 0, -0.005, 0.45, 1, 0.8);
    // Eyes: white, iris (the tell glows here), catch-light.
    for (const sx of [-1, 1]) {
      add(head, geo.sphere(0.019, 10, 8), white, sx * 0.041, 0.022, 0.093, 1, 0.75, 0.6);
      add(head, geo.sphere(0.0105, 8, 6), irisMat, sx * 0.041, 0.022, 0.104);
      add(head, geo.sphere(0.003, 4, 4), glintMat, sx * 0.041 + 0.004, 0.027, 0.114);
      add(head, geo.box(0.046, 0.011, 0.014), hair, sx * 0.043, 0.052, 0.104, 1, 1, 1, 0, 0, sx * -0.12);
    }
    add(head, geo.box(0.052, 0.011, 0.016), lip, 0, -0.072, 0.104);

    // Hair.
    if (c.hairStyle !== 'bald') {
      const capScale = c.hairStyle === 'bob' ? [1.0, 1.0, 1.08] : [0.95, 1.0, 1.04];
      add(head, geo.dome(0.125), hair, 0, 0.02, -0.006, capScale[0], capScale[1], capScale[2], -0.3);
      if (c.hairStyle === 'bob') {
        add(head, geo.box(0.25, 0.2, 0.12), hair, 0, -0.05, -0.06);
        add(head, geo.box(0.04, 0.17, 0.12), hair, -0.11, -0.04, 0.01);
        add(head, geo.box(0.04, 0.17, 0.12), hair, 0.11, -0.04, 0.01);
      }
      if (c.hairStyle === 'slick') add(head, geo.box(0.2, 0.03, 0.06), hair, 0, 0.1, 0.06, 1, 1, 1, -0.4);
      if (c.hairStyle === 'side') add(head, geo.box(0.12, 0.035, 0.05), hair, -0.04, 0.105, 0.07, 1, 1, 1, -0.3, 0, 0.15);
    } else {
      add(head, geo.dome(0.124), hair, 0, -0.01, -0.03, 0.97, 0.45, 0.95, -1.2);
    }
    // Facial hair.
    if (c.facial === 'mustache' || c.facial === 'beard') {
      add(head, geo.box(0.07, 0.016, 0.02), hair, 0, -0.054, 0.108);
    }
    if (c.facial === 'beard' || c.facial === 'stubble') {
      const m = c.facial === 'beard' ? hair : skinDark;
      add(head, geo.dome(0.104), m, 0, -0.05, 0.012, 0.86, 0.7, 0.95, Math.PI);
    }
    if (c.glasses) {
      for (const sx of [-1, 1]) {
        add(head, geo.torus(0.024, 0.0035, 6, 16, Math.PI * 2), frame, sx * 0.042, 0.022, 0.118);
        add(head, geo.box(0.05, 0.004, 0.004), frame, sx * 0.085, 0.024, 0.07, 1, 1, 1, 0, sx * 1.3, 0);
      }
      add(head, geo.box(0.02, 0.004, 0.004), frame, 0, 0.026, 0.12);
    }
    if (c.hat === 'fedora') {
      add(head, geo.cylinder(0.22, 0.22, 0.012, 22), lapel, 0, 0.105, 0.01, 1, 1, 1, 0.1);
      add(head, geo.cylinder(0.11, 0.128, 0.13, 16), suit, 0, 0.17, 0.0);
      add(head, geo.cylinder(0.13, 0.13, 0.03, 16), tie, 0, 0.125, 0.0);
    }

    armL = makeArm(-1, suit, shirt, skin);
    armR = makeArm(1, suit, shirt, skin);
    body.add(armL.root, armR.root);
    built.push(armL.root, armR.root);
  }

  function makeArm(side, suit, shirt, skin) {
    const r = new Group();
    r.position.set(side * 0.27, 1.46, 0.0);
    add(r, geo.cylinder(0.058, 0.052, 0.36, 10), suit, 0, -0.18, 0);
    const fore = new Group();
    fore.position.set(0, -0.36, 0);
    r.add(fore);
    add(fore, geo.cylinder(0.05, 0.045, 0.32, 10), suit, 0, -0.16, 0);
    add(fore, geo.cylinder(0.047, 0.047, 0.03, 10), shirt, 0, -0.32, 0);
    add(fore, geo.box(0.075, 0.1, 0.035), skin, 0, -0.39, 0.0);
    add(fore, geo.box(0.022, 0.05, 0.022), skin, side * -0.045, -0.37, 0.012, 1, 1, 1, 0, 0, side * 0.5);
    return { root: r, fore };
  }

  build(CAST[0]);

  let mood = 'idle';
  let tell = false;
  let aim = false;
  let t = 0;
  let shake = 0;
  let nod = 0;
  let down = 0;
  let back = 0;

  const lerpTo = (obj, key, want, k) => { obj[key] += (want - obj[key]) * k; };

  return {
    root,
    setLook(character) {
      build(character || CAST[0]);
      down = 0;
      back = 0;
    },
    headPos(out) {
      return head.getWorldPosition(out);
    },
    setMood(next) {
      mood = next;
      if (next === 'bang' || next === 'shot') shake = 1;
      if (next === 'click') nod = 1;
    },
    setTell(on) {
      tell = Boolean(on);
    },
    /** 'temple' (own head), 'you' (across the table), or false. */
    setAim(on) {
      aim = on === true ? 'temple' : on || false;
    },
    update(dt, reducedMotion = false) {
      t += dt;
      shake = Math.max(0, shake - dt * 2.2);
      nod = Math.max(0, nod - dt * 1.8);
      const fast = reducedMotion ? 1 : 0;
      const wantDown = mood === 'out' ? 1 : 0;
      const wantBack = mood === 'shot' ? 1 : 0;
      down += (wantDown - down) * Math.min(1, fast || dt * (wantDown ? 5 : 2));
      back += (wantBack - back) * Math.min(1, fast || dt * (wantBack ? 9 : 2));
      const limp = Math.max(down, back);
      const breathe = reducedMotion || limp > 0.5 ? 0 : Math.sin(t * 1.4) * 0.008;
      body.position.y = breathe;

      // Lean: forward when thinking, slumped onto the table when out,
      // thrown back in the chair when shot.
      const lean = mood === 'think' || mood === 'pull' ? 0.1 : mood === 'win' ? -0.05 : 0.02;
      const wantLean = lean + down * 0.5 - back * 0.55;
      root.rotation.x += (wantLean - root.rotation.x) * Math.min(1, dt * (reducedMotion ? 12 : 5));
      root.position.z = -0.92 - back * 0.12;

      head.rotation.x = (reducedMotion ? 0 : Math.sin(t * 0.6) * 0.03) - nod * 0.2 + down * 0.6 - back * 0.7;
      const idleY = reducedMotion || aim || limp > 0.3 ? 0 : Math.sin(t * 0.45) * 0.08;
      if (shake > 0 && !reducedMotion) {
        head.rotation.y = idleY + (Math.random() - 0.5) * shake * 0.05;
        head.rotation.z = (Math.random() - 0.5) * shake * 0.15 + down * 0.25 - back * 0.2;
      } else {
        head.rotation.y = idleY;
        head.rotation.z = down * 0.25 - back * 0.2;
      }

      if (tell) {
        irisMat.color.setHex(0xffa630);
        glintMat.opacity = reducedMotion ? 1 : 0.5 + Math.abs(Math.sin(t * 12)) * 0.5;
      } else {
        irisMat.color.setHex(0x1a120c);
        glintMat.opacity = limp > 0.3 ? 0 : 0.8;
      }

      const k = Math.min(1, dt * 6);
      const temple = aim === 'temple' && limp < 0.3;
      const atYou = aim === 'you' && limp < 0.3;
      // Gun hand is their right (our left, armL).
      lerpTo(armL.root.rotation, 'z', temple ? -2.4 : 0, k);
      lerpTo(armL.root.rotation, 'x', temple ? -0.3 : atYou ? -1.5 : -0.4 - back * -0.6, k);
      lerpTo(armL.fore.rotation, 'x', temple ? -0.1 : atYou ? -0.05 : -0.9 + limp * 0.5, k);
      lerpTo(armL.fore.rotation, 'z', temple ? 2.0 : 0, k);
      lerpTo(armR.root.rotation, 'x', -0.4 - (mood === 'pull' ? 0.2 : 0) + back * 0.6, k);
      lerpTo(armR.fore.rotation, 'x', -0.9 + limp * 0.5, k);
    },
    dispose() {
      looks.forEach((m) => m.dispose());
      irisMat.dispose();
      glintMat.dispose();
    },
  };
}
