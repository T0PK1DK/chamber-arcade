/**
 * Camera framing per aspect ratio. Pure numbers (no Three) so it is Node-tested.
 *
 * A fixed vertical FOV crops a portrait phone to just the drum and cuts
 * HOUSE's head off. Blend from the landscape shot to a taller, wider,
 * further-back shot as the screen gets narrower, and aim lower so the
 * table sits above the thumb-zone HUD.
 */

const WIDE = 1.25;
const TALL = 0.5;

const lerp = (a, b, t) => a + (b - a) * t;

export function portraitBlend(aspect) {
  if (!Number.isFinite(aspect) || aspect <= 0) return 0;
  return Math.min(1, Math.max(0, (WIDE - aspect) / (WIDE - TALL)));
}

export function framing(aspect) {
  const t = portraitBlend(aspect);
  return {
    t,
    fov: lerp(44, 64, t),
    home: [0, lerp(1.66, 2.08, t), lerp(2.9, 3.2, t)],
    pull: [0, lerp(1.46, 1.86, t), lerp(2.15, 2.55, t)],
    look: [0, lerp(0.9, 1.02, t), lerp(-0.2, -0.3, t)],
  };
}
