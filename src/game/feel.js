/**
 * Game-feel envelopes: camera trauma, hit-stop, drum punch, FOV kick, flash.
 * Pure numbers, no DOM / Three, so the timing is Node-tested and the scene
 * just reads the values each frame.
 *
 * Shake uses trauma² so small kicks stay subtle and the hit really lands.
 */

export const HITSTOP_BANG = 0.09;

const KICKS = {
  bang: { trauma: 1, punch: 1, fov: 1, flash: 1, stop: HITSTOP_BANG },
  click: { trauma: 0.32, punch: 0.55, fov: 0, flash: 0, stop: 0 },
  spin: { trauma: 0.14, punch: 0.25, fov: 0, flash: 0, stop: 0 },
  land: { trauma: 0.08, punch: 0.3, fov: 0, flash: 0, stop: 0 },
  win: { trauma: 0.2, punch: 0.4, fov: 0.35, flash: 0, stop: 0 },
};

export function createFeel({ calm = false } = {}) {
  let trauma = 0;
  let punch = 0;
  let fov = 0;
  let flash = 0;
  let stop = 0;

  return {
    calm,
    kick(kind) {
      const k = KICKS[kind];
      if (!k) return;
      // Reduced motion keeps a soft flash so the hit still reads, nothing moves.
      if (calm) {
        flash = Math.max(flash, k.flash * 0.4);
        return;
      }
      trauma = Math.min(1, Math.max(trauma, k.trauma));
      punch = Math.max(punch, k.punch);
      fov = Math.max(fov, k.fov);
      flash = Math.max(flash, k.flash);
      stop = Math.max(stop, k.stop);
    },
    /** Advance envelopes. Returns the dt the world should simulate (0 during hit-stop). */
    step(dt) {
      let sim = dt;
      if (stop > 0) {
        const used = Math.min(stop, dt);
        stop -= used;
        sim = dt - used;
      }
      trauma = Math.max(0, trauma - dt * 1.6);
      punch = Math.max(0, punch - dt * 4.5);
      fov = Math.max(0, fov - dt * 2.2);
      flash = Math.max(0, flash - dt * 2.4);
      return sim;
    },
    get shake() {
      return trauma * trauma;
    },
    get punch() {
      return punch;
    },
    get fov() {
      return fov;
    },
    get flash() {
      return flash;
    },
    get stopped() {
      return stop > 0;
    },
    reset() {
      trauma = 0;
      punch = 0;
      fov = 0;
      flash = 0;
      stop = 0;
    },
  };
}
