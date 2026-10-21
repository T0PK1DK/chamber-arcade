import * as THREE from 'three';

/** Shared materials — one instance per look, no extra textures. */
export function createMaterials() {
  const wall = new THREE.MeshLambertMaterial({ color: 0x16301c });
  const floor = new THREE.MeshLambertMaterial({ color: 0x0c140e });
  const wood = new THREE.MeshLambertMaterial({ color: 0x3a2a16 });
  const felt = new THREE.MeshLambertMaterial({ color: 0x1b4a22 });
  const neon = new THREE.MeshBasicMaterial({ color: 0x39ff14 });
  const metal = new THREE.MeshPhongMaterial({
    color: 0x4a5a4c,
    specular: 0xaaffaa,
    shininess: 70,
  });
  const brass = new THREE.MeshPhongMaterial({
    color: 0x7a6828,
    specular: 0xffee99,
    shininess: 80,
  });
  const darkMetal = new THREE.MeshPhongMaterial({
    color: 0x2a302a,
    specular: 0x668866,
    shininess: 40,
  });
  const visor = new THREE.MeshBasicMaterial({ color: 0x6cff4a });
  const body = new THREE.MeshLambertMaterial({ color: 0x4a5c4e });
  const accent = new THREE.MeshLambertMaterial({ color: 0x2f4032 });
  const hole = new THREE.MeshLambertMaterial({ color: 0x141814 });
  const holeLive = new THREE.MeshBasicMaterial({ color: 0xff8a2a });
  const holeCurrent = new THREE.MeshBasicMaterial({ color: 0x9dff8a });
  const lamp = new THREE.MeshBasicMaterial({ color: 0xffe7a8 });

  return {
    wall,
    floor,
    wood,
    felt,
    neon,
    metal,
    brass,
    darkMetal,
    visor,
    body,
    accent,
    hole,
    holeLive,
    holeCurrent,
    lamp,
    dispose() {
      Object.values(this).forEach((m) => {
        if (m && m.dispose) m.dispose();
      });
    },
  };
}
