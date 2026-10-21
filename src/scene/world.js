import * as THREE from 'three';
import { createMaterials } from './materials.js';
import { createCylinder } from './cylinder.js';
import { createDealer } from './dealer.js';
import { createQuality } from './quality.js';

export function createWorld(canvas) {
  const quality = createQuality();
  const mats = createMaterials();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality.antialias,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x08110a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  quality.apply(renderer);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x08110a, 7, 16);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 24);
  const camHome = new THREE.Vector3(0, 1.52, 2.85);
  const camPull = new THREE.Vector3(0, 1.32, 2.05);
  camera.position.copy(camHome);
  const look = new THREE.Vector3(0, 1.02, -0.15);
  camera.lookAt(look);

  const ambient = new THREE.AmbientLight(0x4a7a52, 1.05);
  scene.add(ambient);
  const lamp = new THREE.PointLight(0xffe6b0, 32, 10, 1.6);
  lamp.position.set(0, 2.35, 0.15);
  lamp.castShadow = quality.shadows;
  if (quality.shadows) {
    lamp.shadow.mapSize.set(512, 512);
    lamp.shadow.camera.near = 0.2;
    lamp.shadow.camera.far = 6;
  }
  scene.add(lamp);
  const rim = new THREE.PointLight(0x39ff14, 14, 8, 1.8);
  rim.position.set(0.9, 1.7, 1.5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xb0d0b0, 0.55);
  fill.position.set(-2.2, 3.2, 2.2);
  scene.add(fill);
  const backFill = new THREE.PointLight(0x39ff14, 8, 6, 2);
  backFill.position.set(0, 1.8, -1.6);
  scene.add(backFill);

  buildRoom(scene, mats, quality.shadows);
  const cylinder = createCylinder(mats);
  const dealer = createDealer(mats);
  scene.add(cylinder.root, dealer.root);

  let shake = 0;
  let pullBlend = 0;
  let bangFlash = 0;
  let wantedPull = 0;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }
  resize();

  return {
    renderer,
    scene,
    camera,
    cylinder,
    dealer,
    quality,
    resize,
    setPullCam(on) {
      wantedPull = on ? 1 : 0;
    },
    kick(kind) {
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
      quality.sample(dt, renderer, now);
      cylinder.update(dt);
      dealer.update(dt);
      pullBlend += (wantedPull - pullBlend) * Math.min(1, dt * 4);
      shake = Math.max(0, shake - dt * 3.2);
      bangFlash = Math.max(0, bangFlash - dt * 2.4);
      lamp.intensity = 32 - bangFlash * 10 + Math.sin(now * 0.002) * 0.5;
      rim.intensity = 12 + bangFlash * 10;

      camera.position.lerpVectors(camHome, camPull, pullBlend);
      camera.position.x += (Math.random() - 0.5) * shake * 0.08;
      camera.position.y += (Math.random() - 0.5) * shake * 0.06;
      camera.lookAt(look);
    },
    render() {
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
      mats.dispose();
    },
  };
}

function buildRoom(scene, mats, shadows) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = shadows;
  scene.add(floor);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), mats.wall);
  back.position.set(0, 3, -4);
  scene.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), mats.wall);
  left.position.set(-4.5, 3, 0);
  left.rotation.y = Math.PI / 2;
  scene.add(left);
  const right = left.clone();
  right.position.x = 4.5;
  right.rotation.y = -Math.PI / 2;
  scene.add(right);

  const table = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 1.35), mats.wood);
  table.position.set(0, 0.78, -0.05);
  table.castShadow = shadows;
  table.receiveShadow = shadows;
  scene.add(table);

  const felt = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.02, 1.12), mats.felt);
  felt.position.set(0, 0.83, -0.05);
  scene.add(felt);

  const rimGeo = new THREE.BoxGeometry(2.36, 0.05, 0.06);
  const rimF = new THREE.Mesh(rimGeo, mats.neon);
  rimF.position.set(0, 0.84, 0.66);
  const rimB = rimF.clone();
  rimB.position.z = -0.76;
  const rimSideGeo = new THREE.BoxGeometry(0.06, 0.05, 1.42);
  const rimL = new THREE.Mesh(rimSideGeo, mats.neon);
  rimL.position.set(-1.16, 0.84, -0.05);
  const rimR = rimL.clone();
  rimR.position.x = 1.16;
  scene.add(rimF, rimB, rimL, rimR);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.08), mats.darkMetal);
      leg.position.set(sx * 0.95, 0.39, sz * 0.5);
      scene.add(leg);
    }
  }

  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.18, 12), mats.metal);
  shade.position.set(0, 2.42, 0.1);
  scene.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), mats.lamp);
  bulb.position.set(0, 2.32, 0.1);
  scene.add(bulb);

  const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.4, 0.18), mats.accent);
  post.position.set(-1.7, 0.7, -1.6);
  scene.add(post);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), mats.visor);
  screen.position.set(0, 2.15, -2.15);
  scene.add(screen);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 0.08), mats.darkMetal);
  bezel.position.set(0, 2.15, -2.2);
  scene.add(bezel);
}
