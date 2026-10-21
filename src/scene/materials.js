import { MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial } from 'three';

/** Shared materials — one instance per look, no extra textures. */
export function createMaterials({ cheap = false } = {}) {
  const wall = new MeshLambertMaterial({ color: 0x16301c });
  const floor = new MeshLambertMaterial({ color: 0x0c140e });
  const wood = new MeshLambertMaterial({ color: 0x3a2a16 });
  const felt = new MeshLambertMaterial({ color: 0x1b4a22 });
  const neon = new MeshBasicMaterial({ color: 0x39ff14 });
  const shiny = (color, specular, shininess) => (
    cheap
      ? new MeshLambertMaterial({ color })
      : new MeshPhongMaterial({ color, specular, shininess })
  );
  const metal = shiny(0x4a5a4c, 0x557755, 48);
  // Low specular: the drum cap faces the lamp, so a hot highlight whites out the whole face.
  const brass = shiny(0x8a7228, 0x5a4a1c, 36);
  const darkMetal = shiny(0x2a302a, 0x668866, 40);
  const visor = new MeshBasicMaterial({ color: 0x6cff4a });
  const body = new MeshLambertMaterial({ color: 0x4a5c4e });
  const accent = new MeshLambertMaterial({ color: 0x2f4032 });
  const hole = new MeshLambertMaterial({ color: 0x141814 });
  const holeLive = new MeshBasicMaterial({ color: 0xff8a2a });
  const holeCurrent = new MeshBasicMaterial({ color: 0x9dff8a });
  const lamp = new MeshBasicMaterial({ color: 0xffe7a8 });

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
