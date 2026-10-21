import { Group, Mesh } from 'three';

/**
 * Tiny table tokens so both kits stay visible in the 3D view,
 * matching the HUD chips. Original arcade pieces — not Buckshot items.
 */
export function createKits(mats, geo) {
  const root = new Group();
  const you = [];
  const house = [];

  for (let i = 0; i < 2; i += 1) {
    const p = new Mesh(geo.box(0.11, 0.022, 0.16), mats.neon);
    p.position.set(-0.78 + i * 0.16, 0.86, 0.34);
    p.visible = false;
    root.add(p);
    you.push(p);

    const h = new Mesh(geo.box(0.11, 0.022, 0.16), mats.accent);
    h.position.set(0.62 + i * 0.16, 0.86, -0.4);
    h.visible = false;
    root.add(h);
    house.push(h);
  }

  return {
    root,
    paint(state) {
      const show = Boolean(state && state.mode === 'ai');
      you.forEach((mesh, i) => {
        mesh.visible = show && Boolean(state.playerItems[i]);
      });
      house.forEach((mesh, i) => {
        mesh.visible = show && Boolean(state.aiItems[i]);
      });
    },
  };
}
