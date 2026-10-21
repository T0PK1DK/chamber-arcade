import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
} from 'three';

/**
 * Shared BufferGeometries. Same look, fewer GPU buffers.
 */
export function createGeometries() {
  const cache = new Map();

  function get(key, make) {
    let g = cache.get(key);
    if (!g) {
      g = make();
      cache.set(key, g);
    }
    return g;
  }

  return {
    box(w, h, d) {
      return get(`box:${w}:${h}:${d}`, () => new BoxGeometry(w, h, d));
    },
    plane(w, h) {
      return get(`plane:${w}:${h}`, () => new PlaneGeometry(w, h));
    },
    cylinder(rt, rb, h, seg) {
      return get(`cyl:${rt}:${rb}:${h}:${seg}`, () => new CylinderGeometry(rt, rb, h, seg));
    },
    sphere(r, w, h) {
      return get(`sph:${r}:${w}:${h}`, () => new SphereGeometry(r, w, h));
    },
    circle(r, seg) {
      return get(`cir:${r}:${seg}`, () => new CircleGeometry(r, seg));
    },
    ring(inner, outer, seg) {
      return get(`ring:${inner}:${outer}:${seg}`, () => new RingGeometry(inner, outer, seg));
    },
    dispose() {
      cache.forEach((g) => g.dispose());
      cache.clear();
    },
  };
}
