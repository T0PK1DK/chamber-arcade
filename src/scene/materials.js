import * as THREE from 'three';

/** Shared materials — one instance per look, no extra textures. */
export function createMaterials() {
  const wall = new THREE.MeshLambertMaterial({ color: 0x0b120c });
  const floor = new THREE.MeshLambertMaterial({ color: 0x070907 });
  const wood = new THREE.MeshLambertMaterial({ color: 0x1a140c });
  const felt = new THREE.MeshLambertMaterial({ color: 0x0c2210 });
  const neon = new THREE.MeshLambertMaterial({
    color: 0x39ff14,
    emissive: 0x1dff00,
    emissiveIntensity: 0.85,
  });
  const metal = new THREE.MeshPhongMaterial({
    color: 0x2a332c,
    specular: 0x88ff88,
    shininess: 70,
  });
  const brass = new THREE.MeshPhongMaterial({
    color: 0x8a7a3a,
    specular: 0xffee88,
    shininess: 90,
  });
  const darkMetal = new THREE.MeshPhongMaterial({
    color: 0x121412,
    specular: 0x335533,
    shininess: 40,
  });
  const visor = new THREE.MeshLambertMaterial({
    color: 0x39ff14,
    emissive: 0x22cc10,
    emissiveIntensity: 1.1,
  });
  const body = new THREE.MeshLambertMaterial({ color: 0x1c241e });
  const accent = new THREE.MeshLambertMaterial({ color: 0x2e3d30 });
  const hole = new THREE.MeshLambertMaterial({
    color: 0x050505,
    emissive: 0x031405,
    emissiveIntensity: 0.4,
  });
  const holeLive = new THREE.MeshLambertMaterial({
    color: 0xff7a18,
    emissive: 0xff5500,
    emissiveIntensity: 0.9,
  });
  const holeCurrent = new THREE.MeshLambertMaterial({
    color: 0xd6ffe0,
    emissive: 0x88ff88,
    emissiveIntensity: 1,
  });
  const lamp = new THREE.MeshLambertMaterial({
    color: 0xfff1c1,
    emissive: 0xffd27a,
    emissiveIntensity: 0.8,
  });

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
