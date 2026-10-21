import { Group, Mesh, Quaternion, Euler, Vector3 } from 'three';
import { CHAMBERS } from '../game/logic.js';
import { shortestAngle } from '../game/math.js';

const STEP = (Math.PI * 2) / CHAMBERS;

/**
 * Six-shot revolver from primitives (no model files). Local frame:
 * barrel along +x, top strap +y, grip down and back.
 *
 * Poses: 'table' (lying on the felt), 'player' (at your temple, drawn in
 * camera space at the right edge), 'house' (in HOUSE's hand by its head).
 * Same spin / land / setIndex / onLand / muzzle surface the old drum had.
 */
export function createRevolver(mats, geo) {
  const root = new Group();
  const gun = new Group();
  gun.scale.setScalar(1.1);
  root.add(gun);

  // Cylinder (rotates about the barrel axis).
  const drum = new Group();
  gun.add(drum);
  const body = new Mesh(geo.cylinder(0.078, 0.078, 0.12, 18), mats.steel);
  body.rotation.z = Math.PI / 2;
  drum.add(body);
  const fluteGeo = geo.box(0.1, 0.012, 0.022);
  for (let i = 0; i < CHAMBERS; i += 1) {
    const a = i * STEP + STEP / 2;
    const flute = new Mesh(fluteGeo, mats.steelDark);
    flute.position.set(0, Math.cos(a) * 0.074, Math.sin(a) * 0.074);
    flute.rotation.x = -a;
    drum.add(flute);
  }
  // Chamber mouths on the front face.
  const mouthGeo = geo.cylinder(0.019, 0.019, 0.01, 10);
  for (let i = 0; i < CHAMBERS; i += 1) {
    const a = i * STEP;
    const mouth = new Mesh(mouthGeo, mats.hole);
    mouth.rotation.z = Math.PI / 2;
    mouth.position.set(0.058, Math.cos(a) * 0.046, Math.sin(a) * 0.046);
    drum.add(mouth);
  }

  const part = (g, m, x, y, z, rz = 0) => {
    const mesh = new Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rz;
    gun.add(mesh);
    return mesh;
  };
  // Frame around the cylinder, barrel, under-lug, sight.
  part(geo.box(0.2, 0.026, 0.05), mats.steel, 0.01, 0.088, 0);
  part(geo.box(0.17, 0.04, 0.05), mats.steel, 0.0, -0.082, 0);
  part(geo.box(0.06, 0.2, 0.05), mats.steel, -0.085, 0.0, 0);
  part(geo.box(0.05, 0.19, 0.05), mats.steel, 0.085, 0.0, 0);
  const barrel = part(geo.cylinder(0.024, 0.024, 0.36, 12), mats.steel, 0.29, 0.052, 0, Math.PI / 2);
  barrel.castShadow = true;
  part(geo.box(0.3, 0.036, 0.036), mats.steelDark, 0.27, 0.014, 0);
  part(geo.box(0.02, 0.022, 0.01), mats.steelDark, 0.455, 0.082, 0);
  part(geo.cylinder(0.026, 0.026, 0.006, 12), mats.hole, 0.472, 0.052, 0, Math.PI / 2);

  // Trigger guard + trigger.
  const guard = part(geo.torus(0.045, 0.007, 6, 14, Math.PI), mats.steel, 0.0, -0.1, 0, Math.PI);
  guard.scale.set(1.15, 0.9, 1);
  part(geo.box(0.012, 0.055, 0.012), mats.steelDark, -0.008, -0.118, 0, 0.25);

  // Walnut grip, raked back.
  part(geo.box(0.085, 0.24, 0.056), mats.grip, -0.15, -0.16, 0, -0.42);
  part(geo.box(0.07, 0.02, 0.06), mats.steel, -0.2, -0.27, 0, -0.42);

  // Hammer pivots back when cocked.
  const hammer = new Group();
  hammer.position.set(-0.11, 0.06, 0);
  gun.add(hammer);
  const hammerBody = new Mesh(geo.box(0.024, 0.07, 0.018), mats.steelDark);
  hammerBody.position.set(0, 0.03, 0);
  hammer.add(hammerBody);
  const spur = new Mesh(geo.box(0.04, 0.014, 0.022), mats.steelDark);
  spur.position.set(-0.016, 0.066, 0);
  hammer.add(spur);

  const muzzlePoint = new Group();
  muzzlePoint.position.set(0.48, 0.052, 0);
  gun.add(muzzlePoint);

  // Pose targets (world). 'player' is filled from the camera each frame.
  const poses = {
    table: {
      pos: new Vector3(0.05, 0.9, 0.12),
      quat: new Quaternion().setFromEuler(new Euler(-Math.PI / 2 + 0.45, -0.32, 0, 'YXZ')),
    },
    house: {
      // Muzzle at HOUSE's right temple (our left); the gun angles down
      // and out toward the raised hand.
      pos: new Vector3(-0.62, 1.56, -0.8),
      quat: new Quaternion().setFromEuler(new Euler(0, 0.1, 0.6, 'YXZ')),
    },
    player: { pos: new Vector3(), quat: new Quaternion() },
  };
  // Your pull: the revolver lifts off the table and out of frame toward you
  // (bottom right). The shot holds on HOUSE watching you, like a film would;
  // a first-person gun this close to the lens only reads as a black slab.
  const camOffset = new Vector3(0.6, -0.55, -0.35);
  const camRot = new Quaternion().setFromEuler(new Euler(0.04, -2.75, 0.22, 'YXZ'));
  root.position.copy(poses.table.pos);
  root.quaternion.copy(poses.table.quat);

  let pose = 'table';
  let spinVel = 0;
  let target = 0;
  let spinning = false;
  let onLand = null;
  let cockWanted = 0;
  let cock = 0;

  function angleFor(index) {
    return -index * STEP;
  }

  return {
    root,
    muzzle(out) {
      return muzzlePoint.getWorldPosition(out);
    },
    onLand(fn) {
      onLand = fn;
    },
    setPose(next) {
      pose = poses[next] ? next : 'table';
    },
    get pose() {
      return pose;
    },
    /** Hammer back (true) or fallen (false). */
    setCocked(on) {
      cockWanted = on ? 1 : 0;
    },
    kickSpin() {
      spinning = true;
      spinVel = 22;
    },
    land(index) {
      target = angleFor(index);
      spinning = true;
      spinVel = Math.max(spinVel, 16);
    },
    setIndex(index, instant) {
      target = angleFor(index);
      if (instant) {
        drum.rotation.x = target;
        spinning = false;
        spinVel = 0;
      } else {
        spinning = true;
      }
    },
    // Chamber state lives on the HUD dial; the 3D gun just looks the part.
    paint() {},
    update(dt, reducedMotion = false, punch = 0, camera = null) {
      if (camera && pose === 'player') {
        poses.player.pos.copy(camOffset).applyMatrix4(camera.matrixWorld);
        poses.player.quat.copy(camera.quaternion).multiply(camRot);
      }
      const p = poses[pose];
      const k = reducedMotion ? 1 : Math.min(1, dt * (pose === 'table' ? 5 : 3.2));
      root.position.lerp(p.pos, k);
      root.quaternion.slerp(p.quat, k);


      cock += (cockWanted - cock) * Math.min(1, dt * (cockWanted ? 7 : 30));
      hammer.rotation.z = cock * 0.75;
      // Recoil: kick the muzzle up.
      gun.rotation.z = punch * 0.35;

      if (!spinning) return;
      if (reducedMotion) {
        drum.rotation.x = target;
        spinning = false;
        spinVel = 0;
        return;
      }
      drum.rotation.x += spinVel * dt;
      spinVel *= Math.exp(-2.4 * dt);
      if (spinVel < 3.2) {
        const err = shortestAngle(drum.rotation.x, target);
        drum.rotation.x += err * Math.min(1, 9 * dt);
        if (Math.abs(err) < 0.02 && spinVel < 0.4) {
          drum.rotation.x = target;
          spinning = false;
          spinVel = 0;
          if (onLand) onLand();
        }
      }
    },
    dispose() {},
  };
}
