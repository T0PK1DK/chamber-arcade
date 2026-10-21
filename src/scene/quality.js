export function detectMobile() {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 720;
}

/**
 * Cap DPR and skip antialias / shadows on phones.
 * Adaptive: if we sit under 28 fps for a stretch, drop another notch.
 */
export function createQuality() {
  const mobile = detectMobile();
  let tier = mobile ? 0 : 1;
  let frames = 0;
  let acc = 0;
  let lastAdjust = 0;

  function dpr() {
    const cap = tier === 0 ? 1.15 : 1.6;
    return Math.min(window.devicePixelRatio || 1, cap);
  }

  return {
    mobile,
    get tier() {
      return tier;
    },
    antialias: !mobile,
    shadows: !mobile,
    dpr,
    apply(renderer) {
      renderer.setPixelRatio(dpr());
    },
    sample(dt, renderer, now) {
      frames += 1;
      acc += dt;
      if (frames < 45 || now - lastAdjust < 2500) return;
      const fps = frames / acc;
      frames = 0;
      acc = 0;
      if (fps < 28 && tier > 0) {
        tier = 0;
        lastAdjust = now;
        renderer.setPixelRatio(dpr());
        renderer.shadowMap.enabled = false;
      }
    },
  };
}
