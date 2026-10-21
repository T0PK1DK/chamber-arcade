import {
  ACESFilmicToneMapping,
  AmbientLight,
  BasicShadowMap,
  DirectionalLight,
  Fog,
  Mesh,
  PerspectiveCamera,
  PointLight,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { createMaterials } from './materials.js';
import { createGeometries } from './geometries.js';
import { createCylinder } from './cylinder.js';
import { createDealer } from './dealer.js';
import { createKits } from './kits.js';
import { createQuality } from './quality.js';

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
  renderer.setClearColor(0x08110a, 1);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = BasicShadowMap;
  quality.apply(renderer);
  quality.attachOverlay(document.getElementById('scan'));

  const scene = new Scene();
  scene.fog = new Fog(0x08110a, quality.mobile ? 6 : 7, quality.mobile ? 13 : 16);

  const camera = new PerspectiveCamera(46, 1, 0.1, 24);
  const camHome = new Vector3(0, 1.52, 2.85);
  const camPull = new Vector3(0, 1.32, 2.05);
  const camPos = new Vector3();
  camera.position.copy(camHome);
  const look = new Vector3(0, 1.02, -0.15);
  camera.lookAt(look);

  const ambient = new AmbientLight(0x4a7a52, quality.mobile ? 1.2 : 1.05);
  scene.add(ambient);
  const lamp = new PointLight(0xffe6b0, 32, 10, 1.6);
  lamp.position.set(0, 2.35, 0.15);
  lamp.castShadow = quality.shadows;
  if (quality.shadows) {
    lamp.shadow.mapSize.set(512, 512);
    lamp.shadow.camera.near = 0.2;
    lamp.shadow.camera.far = 6;
  }
  scene.add(lamp);
  const fill = new DirectionalLight(0xb0d0b0, quality.mobile ? 0.7 : 0.55);
  fill.position.set(-2.2, 3.2, 2.2);
  scene.add(fill);

  let rim = null;
  let backFill = null;
  if (quality.extraLights) {
    rim = new PointLight(0x39ff14, 14, 8, 1.8);
    rim.position.set(0.9, 1.7, 1.5);
    scene.add(rim);
    backFill = new PointLight(0x39ff14, 8, 6, 2);
    backFill.position.set(0, 1.8, -1.6);
    scene.add(backFill);
  }

  const props = buildRoom(scene, mats, geo, quality);
  const cylinder = createCylinder(mats, geo);
  const dealer = createDealer(mats, geo);
  const kits = createKits(mats, geo);
  scene.add(cylinder.root, dealer.root, kits.root);

  let shake = 0;
  let pullBlend = 0;
  let bangFlash = 0;
  let wantedPull = 0;

  function resize() {
    const vv = window.visualViewport;
    const w = (vv && vv.width) || canvas.clientWidth || window.innerWidth;
    const h = (vv && vv.height) || canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
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
    cylinder,
    dealer,
    kits,
    quality,
    resize,
    setPullCam(on) {
      wantedPull = on ? 1 : 0;
      if (quality.reducedMotion) pullBlend = wantedPull;
    },
    kick(kind) {
      if (quality.reducedMotion) {
        if (kind === 'bang') bangFlash = 0.4;
        return;
      }
      if (kind === 'bang') {
        shake = 1;
        bangFlash = 1;
      } else if (kind === 'click') {
        shake = 0.28;
      } else {
        shake = 0.12;
      }
    },
    update(dt, now) {
      const calm = quality.reducedMotion;
      quality.sample(dt, renderer, now);
      cylinder.update(dt, calm);
      dealer.update(dt, calm);
      if (!calm) pullBlend += (wantedPull - pullBlend) * Math.min(1, dt * 4);
      else pullBlend = wantedPull;
      shake = Math.max(0, shake - dt * 3.2);
      bangFlash = Math.max(0, bangFlash - dt * 2.4);

      const sway = calm ? 0 : Math.sin(now * 0.0011) * 0.035;
      props.shade.position.x = sway;
      props.bulb.position.x = sway;
      props.cord.position.x = sway * 0.45;
      lamp.position.x = sway;
      lamp.intensity = 32 - bangFlash * 10 + (calm ? 0 : Math.sin(now * 0.002) * 0.5);
      if (rim) rim.intensity = 12 + bangFlash * 10;
      props.screen.material.opacity = calm ? 0.95 : 0.72 + Math.sin(now * 0.006) * 0.18;

      camPos.lerpVectors(camHome, camPull, pullBlend);
      if (shake > 0) {
        camPos.x += (Math.random() - 0.5) * shake * 0.08;
        camPos.y += (Math.random() - 0.5) * shake * 0.06;
      }
      camera.position.copy(camPos);
      camera.lookAt(look);
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
      cylinder.dispose();
      dealer.dispose();
      props.screen.material.dispose();
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
  scene.add(felt);

  const rimGeo = geo.box(2.36, 0.05, 0.06);
  const rimF = new Mesh(rimGeo, mats.neon);
  rimF.position.set(0, 0.84, 0.66);
  const rimB = new Mesh(rimGeo, mats.neon);
  rimB.position.set(0, 0.84, -0.76);
  const rimSideGeo = geo.box(0.06, 0.05, 1.42);
  const rimL = new Mesh(rimSideGeo, mats.neon);
  rimL.position.set(-1.16, 0.84, -0.05);
  const rimR = new Mesh(rimSideGeo, mats.neon);
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

  const screen = new Mesh(geo.plane(1.8, 0.9), mats.visor);
  screen.position.set(0, 2.15, -2.15);
  screen.material = mats.visor.clone();
  screen.material.transparent = true;
  screen.material.opacity = 0.85;
  scene.add(screen);
  const bezel = new Mesh(geo.box(2.0, 1.1, 0.08), mats.darkMetal);
  bezel.position.set(0, 2.15, -2.2);
  scene.add(bezel);

  return { shade, bulb, cord, screen };
}
