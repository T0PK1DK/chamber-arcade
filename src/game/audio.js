import { loadMuted, saveMuted } from './storage.js';

/**
 * One shared AudioContext. Oscillators + a short noise burst.
 * No sample files — keeps the first paint tiny and works offline.
 */
export function createAudio() {
  let ctx = null;
  let muted = loadMuted();
  const jobs = [];

  function ac() {
    if (muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function later(ms, fn) {
    const id = setTimeout(() => {
      const i = jobs.indexOf(id);
      if (i >= 0) jobs.splice(i, 1);
      fn();
    }, ms);
    jobs.push(id);
    return id;
  }

  function hush() {
    jobs.splice(0).forEach(clearTimeout);
  }

  function tone(f0, f1, dur, vol, type = 'sine') {
    const c = ac();
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, vol) {
    const c = ac();
    if (!c) return;
    const n = Math.floor(c.sampleRate * dur);
    const b = c.createBuffer(1, n, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
    const s = c.createBufferSource();
    const g = c.createGain();
    s.buffer = b;
    g.gain.value = vol;
    s.connect(g);
    g.connect(c.destination);
    s.start();
  }

  return {
    get muted() {
      return muted;
    },
    setMuted(value) {
      muted = Boolean(value);
      saveMuted(muted);
      if (muted) hush();
    },
    hush,
    unlock() {
      ac();
    },
    /** Dry fire: hammer falls on an empty chamber. */
    click() {
      noise(0.03, 0.35);
      tone(2400, 1200, 0.03, 0.12, 'square');
      tone(180, null, 0.05, 0.08, 'triangle');
    },
    /** Hammer drawn back: two-stage ratchet. */
    cock() {
      tone(1700, 900, 0.025, 0.07, 'square');
      later(110, () => {
        noise(0.025, 0.2);
        tone(2100, 1100, 0.03, 0.09, 'square');
      });
    },
    heartbeat() {
      tone(62, 44, 0.12, 0.35, 'sine');
      later(170, () => tone(56, 40, 0.14, 0.28, 'sine'));
    },
    cash() {
      [1568, 2093].forEach((f, i) => later(i * 70, () => tone(f, null, 0.18, 0.07, 'triangle')));
      later(170, () => noise(0.12, 0.12));
    },
    /** Cylinder freewheel: a ratchet that slows down. */
    spin() {
      let t = 0;
      for (let i = 0; i < 12; i += 1) {
        t += 45 + i * 9;
        later(t, () => tone(1500 - i * 25, null, 0.02, 0.05, 'square'));
      }
    },
    /** self = it was your pull: the report, then a long high ear-ring. */
    bang(self = false) {
      noise(0.5, 0.55);
      tone(90, 30, 0.5, 0.5);
      if (self) later(60, () => tone(3900, 3600, 2.6, 0.035, 'sine'));
    },
    item() {
      tone(520, 880, 0.12, 0.08, 'triangle');
    },
    tick() {
      tone(240, null, 0.04, 0.05, 'square');
    },
    land() {
      tone(1900, 900, 0.035, 0.05, 'square');
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => {
        later(i * 90, () => tone(f, null, 0.14, 0.08, 'square'));
      });
    },
  };
}
