import { MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial } from 'three';

/** Shared materials — one instance per look, no extra textures. */
export function createMaterials({ cheap = false } = {}) {
  // Noir backroom: oxblood wallpaper, dark boards, green card-table baize.
  const wall = new MeshLambertMaterial({ color: 0x2a1512 });
  const floor = new MeshLambertMaterial({ color: 0x140d09 });
  const wood = new MeshLambertMaterial({ color: 0x3a2213 });
  const felt = new MeshLambertMaterial({ color: 0x1d4a2c });
  const neon = new MeshBasicMaterial({ color: 0xd8b25a });
  const shiny = (color, specular, shininess) => (
    cheap
      ? new MeshLambertMaterial({ color })
      : new MeshPhongMaterial({ color, specular, shininess })
  );
  const metal = shiny(0x4a5a4c, 0x557755, 48);
  // Low specular: the drum cap faces the lamp, so a hot highlight whites out the whole face.
  const brass = shiny(0x8a7228, 0x5a4a1c, 36);
  const darkMetal = shiny(0x2a302a, 0x668866, 40);
  // Blued revolver steel and a walnut grip.
  const steel = shiny(0x2b2f36, 0x3a4250, 40);
  const steelDark = shiny(0x16181c, 0x262a32, 30);
  const grip = shiny(0x24130a, 0x1a1008, 16);
  const visor = new MeshBasicMaterial({ color: 0x4a3a2a });
  const body = new MeshLambertMaterial({ color: 0x24252b });
  const accent = new MeshLambertMaterial({ color: 0x15161a });
  const shirt = new MeshLambertMaterial({ color: 0xcfc6b2 });
  const face = new MeshLambertMaterial({ color: 0x3a2e28 });
  const hole = new MeshLambertMaterial({ color: 0x141814 });
  const holeLive = new MeshBasicMaterial({ color: 0xff8a2a });
  const holeCurrent = new MeshBasicMaterial({ color: 0x9dff8a });
  const lamp = new MeshBasicMaterial({ color: 0xffe2a8 });

  return {
    wall,
    floor,
    wood,
    felt,
    neon,
    metal,
    brass,
    darkMetal,
    steel,
    steelDark,
    grip,
    shirt,
    face,
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
