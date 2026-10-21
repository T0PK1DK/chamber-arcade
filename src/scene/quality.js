export function detectMobile(nav = globalThis.navigator, width = globalThis.innerWidth) {
  if (!nav) return false;
  return /Mobi|Android|iPhone|iPad/i.test(nav.userAgent || '') || (width || 0) < 720;
}

export function prefersReducedMotion(media = globalThis.matchMedia) {
  if (typeof media !== 'function') return false;
  try {
    return Boolean(media('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

/**
 * Cap DPR and skip antialias / shadows on phones.
 * Adaptive: if we sit under 28 fps for a stretch, drop another notch
 * (DPR, extra lights already off, scanlines hidden).
 */
export function createQuality({
  mobile = detectMobile(),
  reducedMotion = prefersReducedMotion(),
} = {}) {
  let tier = mobile || reducedMotion ? 0 : 1;
  let frames = 0;
  let acc = 0;
  let lastAdjust = 0;
  let scan = null;

  function dpr() {
    const cap = tier === 0 ? 1.1 : 1.5;
    return Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, cap);
  }

  function syncOverlay() {
    if (!scan) return;
    scan.classList.toggle('off', tier === 0 || reducedMotion);
  }

  return {
    mobile,
    reducedMotion,
    get tier() {
      return tier;
    },
    antialias: !mobile && !reducedMotion,
    shadows: !mobile && !reducedMotion,
    extraLights: !mobile,
    precision: mobile ? 'mediump' : 'highp',
    powerPreference: mobile ? 'low-power' : 'high-performance',
    dpr,
    attachOverlay(el) {
      scan = el;
      syncOverlay();
    },
    apply(renderer) {
      renderer.setPixelRatio(dpr());
      renderer.shadowMap.enabled = tier > 0 && !mobile && !reducedMotion;
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
        syncOverlay();
      }
    },
  };
}
