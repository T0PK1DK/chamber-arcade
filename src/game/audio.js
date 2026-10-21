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
    click() {
      tone(880, null, 0.07, 0.1, 'square');
    },
    spin() {
      for (let i = 0; i < 6; i += 1) {
        later(i * 85, () => tone(1300 + i * 40, null, 0.03, 0.045, 'square'));
      }
    },
    bang() {
      noise(0.42, 0.42);
      tone(90, 36, 0.4, 0.4);
    },
    item() {
      tone(520, 880, 0.12, 0.08, 'triangle');
    },
    tick() {
      tone(240, null, 0.04, 0.05, 'square');
    },
  };
}
