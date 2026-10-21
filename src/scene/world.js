import {
  ACESFilmicToneMapping,
  BasicShadowMap,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PointLight,
  SpotLight,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { createMaterials } from './materials.js';
import { createGeometries } from './geometries.js';
import { createRevolver } from './revolver.js';
import { createDealer } from './dealer.js';
import { createKits } from './kits.js';
import { createQuality } from './quality.js';
import { createSparks } from './sparks.js';
import { framing } from './framing.js';
import { createFeel } from '../game/feel.js';

// Turn tint on the brass table trim: warm brass on yours, ember on HOUSE's.
const BRASS = 0xd8b25a;
const EMBER = 0xb8562c;
const MUZZLE = 0xffb060;
const ROOM = 0x0b0807;

export function createWorld(canvas) {
  const quality = createQuality();
  const geo = createGeometries();
  const mats = createMaterials({ cheap: quality.mobile || quality.tier === 0 });

  const renderer = new WebGLRenderer({
    canvas,
    antialias: quality.antialias,
    alpha: false,
    powerPreference: quality.powerPreference,
    precision: quality.precision,
    stencil: false,
    depth: true,
  });
  renderer.setClearColor(ROOM, 1);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = quality.shadows ? PCFSoftShadowMap : BasicShadowMap;
  quality.apply(renderer);
  quality.attachOverlay(document.getElementById('scan'));

  const scene = new Scene();
  // Low, warm haze like a smoky back room.
  scene.fog = new Fog(ROOM, quality.mobile ? 5 : 6, quality.mobile ? 12 : 14);

  const camera = new PerspectiveCamera(44, 1, 0.1, 24);
  const camHome = new Vector3();
  const camPull = new Vector3();
  const camPos = new Vector3();
  const look = new Vector3();
  let baseFov = 44;

  // Lighting: a dark room and one warm lamp pool on the felt.
  // Hemisphere replaces the flat ambient so tops read lighter than undersides.
  const hemi = new HemisphereLight(0x8a7058, 0x0c0806, quality.mobile ? 1.3 : 1.0);
  scene.add(hemi);
  // Desktop adds fill + rim and Phong highlights, so its lamp runs cooler.
  const lampBase = quality.extraLights ? 18 : 26;
  // Wide enough to catch HOUSE's shoulders and tie as well as the felt.
  const lamp = new SpotLight(0xffd8a0, lampBase, 6, 0.98, 0.65, 1.4);
  lamp.position.set(0, 2.3, 0.1);
  lamp.target.position.set(0, 0.8, -0.2);
  lamp.castShadow = quality.shadows;
  if (quality.shadows) {
    // One spot shadow map instead of the point light's six cube faces.
    lamp.shadow.mapSize.set(1024, 1024);
    lamp.shadow.camera.near = 0.5;
    lamp.shadow.camera.far = 3.2;
    lamp.shadow.bias = -0.0015;
    lamp.shadow.radius = 3;
  }
  scene.add(lamp, lamp.target);

  // Muzzle flash. Always present (intensity 0 at rest) so the shader
  // light count never changes and nothing recompiles mid-game.
  const flashLight = new PointLight(MUZZLE, 0, 4, 2);
  flashLight.position.set(0, 1.25, 0.55);
  scene.add(flashLight);

  let fill = null;
  let rim = null;
  let backFill = null;
  if (quality.extraLights) {
    fill = new DirectionalLight(0xe0d0b8, 0.22);
    fill.position.set(-2.2, 3.2, 2.2);
    scene.add(fill);
    // Edge light from the side, kept low so the steel reads but does not glare.
    rim = new PointLight(BRASS, 2.5, 6, 1.8);
    rim.position.set(1.6, 1.5, 0.9);
    scene.add(rim);
    // Back-light behind HOUSE so the hat and shoulders silhouette off the wall.
    backFill = new PointLight(0xffb070, 4, 4, 2);
    backFill.position.set(0, 1.9, -1.55);
    scene.add(backFill);
  }

  const props = buildRoom(scene, mats, geo, quality);
  const gun = createRevolver(mats, geo);
  const dealer = createDealer(mats, geo);
  const kits = createKits(mats, geo);
  const sparks = createSparks();
  scene.add(gun.root, dealer.root, kits.root, sparks.root);
  if (quality.shadows) {
    // Revolver and HOUSE drop soft shadows into the lamp pool (desktop only).
    for (const r of [gun.root, dealer.root]) {
      r.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    }
  }

  const feel = createFeel({ calm: quality.reducedMotion });
  const muzzle = new Vector3();
  const turnColor = new Color(BRASS);
  const wantColor = new Color(BRASS);
  const hitColor = new Color(MUZZLE);
  const tableSpot = new Vector3(0, 0.95, 0.1);
  let pullBlend = 0;
  let wantedPull = 0;
  let tension = 0;

  function resize() {
    const vv = window.visualViewport;
    const w = (vv && vv.width) || canvas.clientWidth || window.innerWidth;
    const h = (vv && vv.height) || canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    const f = framing(camera.aspect);
    baseFov = f.fov;
    camHome.fromArray(f.home);
    camPull.fromArray(f.pull);
    look.fromArray(f.look);
    camera.fov = baseFov;
    camera.updateProjectionMatrix();
  }
  resize();

  const onLost = (e) => { e.preventDefault(); };
  const onRestored = () => {
    quality.apply(renderer);
    resize();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

  return {
    renderer,
    scene,
    camera,
    gun,
    dealer,
    kits,
    quality,
    feel,
    resize,
    setPullCam(on) {
      wantedPull = on ? 1 : 0;
      if (quality.reducedMotion) pullBlend = wantedPull;
    },
    /** 0..1 suspense while a pull is pending (hold ring, HOUSE reaching). */
    setTension(v) {
      tension = Math.max(0, Math.min(1, v));
    },
    /** 'you' | 'house' | 'idle' — tints the neon table rim and the wall screen. */
    setTurn(who) {
      wantColor.setHex(who === 'house' ? EMBER : BRASS);
    },
    kick(kind) {
      feel.kick(kind === 'cash' ? 'win' : kind);
      if (kind === 'bang') {
        gun.muzzle(muzzle);
        flashLight.position.copy(muzzle);
        // Muzzle flash only; no gore. Skipped when the gun is at your own
        // temple (the screen cuts to black instead).
        if (!feel.calm && gun.pose !== 'player') {
          sparks.burst(muzzle, 0xfff0b0, 18, 1.4);
          sparks.burst(muzzle, MUZZLE, 16, 0.9);
        }
      } else if ((kind === 'win' || kind === 'cash') && !feel.calm) {
        // Gold chips scatter across the felt.
        sparks.burst(tableSpot, 0xffd36a, 34, 2.2);
        sparks.burst(tableSpot, 0xfff0c0, 16, 1.6);
      }
    },
    /** 'table' | 'player' | 'house' */
    setGunPose(pose) {
      gun.setPose(pose);
      dealer.setAim(pose === 'house');
    },
    update(dt, now) {
      const calm = quality.reducedMotion;
      quality.sample(dt, renderer, now);
      // Hit-stop: envelopes keep decaying, the table freezes for a beat.
      const sim = feel.step(dt);
      // (gun updates after the camera moves; it can ride in camera space.)
      dealer.update(sim, calm);
      sparks.update(sim);
      if (!calm) pullBlend += (wantedPull - pullBlend) * Math.min(1, sim * 4);
      else pullBlend = wantedPull;
      const flash = feel.flash;

      const sway = calm ? 0 : Math.sin(now * 0.0011) * 0.035;
      props.shade.position.x = sway;
      props.bulb.position.x = sway;
      props.cord.position.x = sway * 0.45;
      lamp.position.x = sway;
      lamp.target.position.x = sway * 0.6;
      // Lamp buzzes under tension and dips when the hit lands.
      const flicker = calm ? 0 : Math.sin(now * 0.002) * 0.6
        + (tension > 0 ? (Math.random() - 0.5) * tension * 7 : 0);
      lamp.intensity = lampBase - flash * 12 + flicker;
      flashLight.intensity = flash * 22;

      turnColor.lerp(wantColor, Math.min(1, dt * 6));
      props.rimMat.color.copy(turnColor).lerp(hitColor, Math.min(1, flash * 1.4));
      props.screen.material.opacity = 0.9;
      if (rim) {
        rim.intensity = 2.5 + flash * 10 + tension * 3;
      }

      camPos.lerpVectors(camHome, camPull, pullBlend);
      const shake = feel.shake;
      if (shake > 0) {
        camPos.x += (Math.random() - 0.5) * shake * 0.12;
        camPos.y += (Math.random() - 0.5) * shake * 0.09;
      }
      if (tension > 0 && !calm) {
        camPos.x += (Math.random() - 0.5) * tension * 0.006;
      }
      camera.position.copy(camPos);
      camera.lookAt(look);
      camera.updateMatrixWorld();
      gun.update(sim, calm, feel.punch, camera);
      const fov = baseFov - feel.fov * 5 - tension * 2.5;
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    },
    render() {
      renderer.render(scene, camera);
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      window.removeEventListener('resize', resize);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', resize);
      renderer.dispose();
      gun.dispose();
      dealer.dispose();
      sparks.dispose();
      props.screen.material.dispose();
      props.rimMat.dispose();
      mats.dispose();
      geo.dispose();
    },
  };
}

function buildRoom(scene, mats, geo, quality) {
  const shadows = quality.shadows;
  const floor = new Mesh(geo.plane(12, 12), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = shadows;
  scene.add(floor);

  const wallGeo = geo.plane(12, 6);
  const back = new Mesh(wallGeo, mats.wall);
  back.position.set(0, 3, -4);
  scene.add(back);
  if (!quality.mobile) {
    const left = new Mesh(wallGeo, mats.wall);
    left.position.set(-4.5, 3, 0);
    left.rotation.y = Math.PI / 2;
    scene.add(left);
    const right = new Mesh(wallGeo, mats.wall);
    right.position.set(4.5, 3, 0);
    right.rotation.y = -Math.PI / 2;
    scene.add(right);
  }

  const table = new Mesh(geo.box(2.3, 0.08, 1.35), mats.wood);
  table.position.set(0, 0.78, -0.05);
  table.castShadow = shadows;
  table.receiveShadow = shadows;
  scene.add(table);

  const felt = new Mesh(geo.box(2.05, 0.02, 1.12), mats.felt);
  felt.position.set(0, 0.83, -0.05);
  felt.receiveShadow = shadows;
  scene.add(felt);

  // Own material so the brass trim can follow the turn colour on its own.
  const rimMat = new MeshBasicMaterial({ color: BRASS });
  const rimGeo = geo.box(2.36, 0.05, 0.06);
  const rimF = new Mesh(rimGeo, rimMat);
  rimF.position.set(0, 0.84, 0.66);
  const rimB = new Mesh(rimGeo, rimMat);
  rimB.position.set(0, 0.84, -0.76);
  const rimSideGeo = geo.box(0.06, 0.05, 1.42);
  const rimL = new Mesh(rimSideGeo, rimMat);
  rimL.position.set(-1.16, 0.84, -0.05);
  const rimR = new Mesh(rimSideGeo, rimMat);
  rimR.position.set(1.16, 0.84, -0.05);
  scene.add(rimF, rimB, rimL, rimR);

  const legGeo = geo.box(0.08, 0.78, 0.08);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new Mesh(legGeo, mats.darkMetal);
      leg.position.set(sx * 0.95, 0.39, sz * 0.5);
      scene.add(leg);
    }
  }

  const shade = new Mesh(geo.cylinder(0.18, 0.32, 0.18, 12), mats.metal);
  shade.position.set(0, 2.42, 0.1);
  scene.add(shade);
  const bulb = new Mesh(geo.sphere(0.07, 10, 10), mats.lamp);
  bulb.position.set(0, 2.32, 0.1);
  scene.add(bulb);
  const cord = new Mesh(geo.cylinder(0.008, 0.008, 0.7, 5), mats.darkMetal);
  cord.position.set(0, 2.85, 0.1);
  scene.add(cord);

  const post = new Mesh(geo.box(0.18, 1.4, 0.18), mats.accent);
  post.position.set(-1.7, 0.7, -1.6);
  scene.add(post);

  // A dark oil painting in a gilt frame, high on the wall behind HOUSE.
  const screen = new Mesh(geo.plane(0.9, 0.62), mats.visor);
  screen.position.set(-1.25, 2.2, -2.15);
  screen.material = mats.visor.clone();
  screen.material.transparent = true;
  screen.material.opacity = 0.9;
  scene.add(screen);
  const bezel = new Mesh(geo.box(1.02, 0.74, 0.06), mats.neon);
  bezel.position.set(-1.25, 2.2, -2.2);
  scene.add(bezel);

  return { shade, bulb, cord, screen, rimMat };
}
