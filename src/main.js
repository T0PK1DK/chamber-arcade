import {
  ITEMS,
  createMatch,
  resetMatch,
  spin,
  pull,
  useItem,
  nextRound,
  canSpin,
  canPull,
  cashOut,
  pass,
} from './game/logic.js';
import { pickCharacter, resolvePersona } from './game/characters.js';
import { decideAi } from './game/ai.js';
import { createAudio } from './game/audio.js';
import { saveBestCash, recordAiMatch } from './game/storage.js';
import {
  itemFromDigit,
  isCashKey,
  isMenuKey,
  isRespinKey,
  isShootKey,
  isPassKey,
  isMuteKey,
  isPrimaryKey,
  modeFromMenuKey,
  spaceAction,
} from './game/input.js';
import { classifyGesture, tableAction, canHoldToPull, HOLD_MS, TAP_MAX_PX } from './game/gesture.js';
import { createHud } from './ui/hud.js';

const canvas = document.getElementById('stage');
const audio = createAudio();

let world = null;
let state = null;
let recordedMatch = false;
let acting = false;
let hidden = false;
let pendingMode = null;
let opponentId = null;
const timers = [];

function later(ms, fn) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

function clearTimers() {
  timers.splice(0).forEach(clearTimeout);
  audio.hush();
  cancelHold();
  if (world) world.setTension(0);
}

function buzz(pattern) {
  if (!navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}

function paintScene() {
  if (!world) return;
  if (!state) {
    world.dealer.setMood('idle');
    world.dealer.setTell(false);
    world.kits.paint(null);
    world.setTurn('idle');
    return;
  }
  world.dealer.setTell(state.tell);
  world.kits.paint(state);
  world.setTurn(state.over ? 'idle' : state.mode === 'ai' && state.aiTurn ? 'house' : 'you');
}

function sync() {
  if (state) hud.render(state);
  paintScene();
}

function lockButtons() {
  acting = true;
}

function unlockButtons() {
  acting = false;
}

function afterHit(result) {
  const victim = result.victim || (result.byAi ? 'ai' : 'player');
  world.kick('bang', { byAi: result.byAi, victim, gore: hud.gore });
  buzz([60, 30, 120]);
  if (victim === 'player') {
    // You took the round (your own pull or theirs across the table):
    // blood hits the lens (if on), then black and a ringing ear.
    audio.bang(true);
    if (hud.gore) {
      hud.flash('bang');
      hud.splat();
      hud.blackout(1500, 650);
    } else {
      hud.blackout(1700);
    }
    world.dealer.setMood(state.mode === 'ai' ? 'win' : 'idle');
    later(1750, () => {
      world.setGunPose('table');
      world.setPullCam(false);
    });
  } else {
    // They took the round. Their own pull: they slump onto the table.
    // Your shot: they're thrown back in the chair.
    audio.bang(false);
    hud.flash('bang');
    world.dealer.setMood(result.byAi ? 'out' : 'shot');
    later(result.byAi ? 450 : 900, () => {
      world.setGunPose('table');
      world.setPullCam(false);
    });
    later(900, () => {
      world.kick('win');
      audio.win();
      hud.flash('win');
    });
  }
  if (state.mode === 'ai' && state.matchOver && !recordedMatch) {
    recordedMatch = true;
    recordAiMatch(state.playerRoundWins > state.aiRoundWins);
    buzz(state.playerRoundWins > state.aiRoundWins ? [30, 40, 30, 40, 80] : [80, 40, 120]);
  }
}

function afterClick(result) {
  world.kick('click');
  world.dealer.setMood(result.byAi ? 'click' : 'idle');
  audio.click();
  if (!result.byAi) {
    hud.flash('safe');
    buzz(15);
  }
  world.gun.setIndex(state.current);
  later(520, () => {
    world.setPullCam(false);
    world.setGunPose('table');
  });
  if (state.mode === 'ai' && state.aiTurn) queueAi();
}

function resolvePull(who, target) {
  if (!state || !world) {
    unlockButtons();
    return;
  }
  const result = pull(state, who, target);
  unlockButtons();
  hud.setAim(false);
  world.setTension(0);
  world.gun.setCocked(false);
  if (!result.ok) {
    world.setPullCam(false);
    sync();
    return;
  }
  if (result.hit) afterHit(result);
  else afterClick(result);
  sync();
}

// Where the revolver goes for each shooter / target.
const POSE = {
  player: { self: 'player', other: 'aimHouse' },
  ai: { self: 'house', other: 'atPlayer' },
};

function beginPull(who, target = 'self') {
  if (!state || !world || acting) return false;
  if (who === 'player' && !canPull(state, 'player')) return false;
  if (who === 'ai' && !canPull(state, 'ai')) return false;
  const aim = state.mode === 'ai' && target === 'other' ? 'other' : 'self';
  lockButtons();
  // The ritual: revolver up (to a temple or across the table), hammer back,
  // a few heartbeats, then the trigger.
  world.setGunPose(POSE[who][aim]);
  world.setPullCam(who === 'player' || aim === 'other');
  // Tunnel vision whenever the gun is pointed at you.
  if ((who === 'player' && aim === 'self') || (who === 'ai' && aim === 'other')) hud.setAim(true);
  sync();
  world.setTension(who === 'ai' ? 0.6 : 0.7);
  world.dealer.setMood(who === 'ai' ? 'pull' : 'think');
  later(320, () => {
    world.gun.setCocked(true);
    audio.cock();
  });
  later(560, () => audio.heartbeat());
  later(who === 'ai' ? 1000 : 960, () => audio.heartbeat());
  later(who === 'ai' ? 1350 : 1250, () => resolvePull(who, aim));
  return true;
}

function doPull() {
  beginPull('player', 'self');
}

function doShoot() {
  if (!state || state.mode !== 'ai') return;
  beginPull('player', 'other');
}

function doPass() {
  if (!state || !world || acting) return;
  if (!pass(state, 'player').ok) return;
  audio.item();
  world.setGunPose('table');
  sync();
  if (state.aiTurn) queueAi();
}

function doSpin() {
  if (!state || !world || acting || !canSpin(state)) return;
  const result = spin(state);
  if (!result.ok) return;
  audio.spin();
  buzz(8);
  world.kick('spin');
  world.setGunPose('table');
  world.gun.kickSpin();
  world.gun.land(state.current);
  world.dealer.setMood('idle');
  world.dealer.setTell(false);
  sync();
}

function spinFx() {
  audio.spin();
  world.gun.kickSpin();
  world.gun.land(state.current);
}

function doItem(item) {
  if (!state || !world || acting) return;
  const result = useItem(state, item, 'player');
  if (!result.ok) return;
  if (item === ITEMS.respin) spinFx();
  else audio.item();
  world.dealer.setMood('think');
  if (result.item === 'rack') world.gun.land(state.current);
  sync();
}

function doCash() {
  if (!state || !world || acting) return;
  const result = cashOut(state);
  if (!result.ok) return;
  audio.cash();
  buzz([20, 40, 20]);
  world.kick('cash');
  world.setGunPose('table');
  hud.flash('win');
  if (saveBestCash(state.mode, result.pot)) state.status = `CASHED OUT $${result.pot} — NEW BEST`;
  sync();
  hud.focusPlay();
}

function queueAi() {
  later(520, () => {
    if (!state || !state.aiTurn || state.over || !world) return;
    const choice = decideAi(state, Math.random, state.persona);
    if (choice.type === 'item') {
      useItem(state, choice.item, 'ai');
      if (choice.item === ITEMS.respin) spinFx();
      else audio.item();
      world.dealer.setMood('think');
      if (choice.item === 'rack') world.gun.land(state.current);
      sync();
      if (state.spun && state.aiTurn) later(choice.item === ITEMS.respin ? 1500 : 640, queueAi);
      return;
    }
    if (choice.type === 'pass') {
      pass(state, 'ai');
      audio.item();
      world.dealer.setMood('think');
      sync();
      if (state.aiTurn) later(700, queueAi);
      return;
    }
    if (choice.type === 'pull') beginPull('ai', choice.target);
  });
}

// A new face at the table each match (never the same one twice running).
function seatOpponent() {
  const c = pickCharacter(Math.random, opponentId);
  opponentId = c.id;
  if (state) {
    state.opponentId = c.id;
    state.persona = resolvePersona(c.persona);
  }
  world.setOpponent(c);
  hud.setOpponent(c.title);
}

function start(mode) {
  if (!world) {
    pendingMode = mode;
    hud.setBoot('LIGHTING THE TABLE…');
    return;
  }
  clearTimers();
  recordedMatch = false;
  acting = false;
  pendingMode = null;
  state = createMatch(mode);
  seatOpponent();
  hud.showGame();
  world.gun.setIndex(0, true);
  world.setGunPose('table');
  hud.clearBlackout();
  hud.clearSplat();
  if (world) world.clearFx();
  hud.setAim(false);
  world.setPullCam(false);
  world.dealer.setMood('idle');
  world.dealer.setTell(false);
  audio.unlock();
  sync();
  hud.focusPlay();
}

function again() {
  if (!state || !world) return;
  clearTimers();
  recordedMatch = false;
  acting = false;
  resetMatch(state);
  seatOpponent();
  world.gun.setIndex(0, true);
  world.setGunPose('table');
  hud.clearBlackout();
  hud.clearSplat();
  if (world) world.clearFx();
  hud.setAim(false);
  world.setPullCam(false);
  world.dealer.setMood('idle');
  world.dealer.setTell(false);
  sync();
  hud.focusPlay();
}

function goNext() {
  if (!state || !world) return;
  clearTimers();
  acting = false;
  if (!nextRound(state).ok) return;
  world.gun.setIndex(0, true);
  world.setGunPose('table');
  hud.clearBlackout();
  hud.clearSplat();
  if (world) world.clearFx();
  hud.setAim(false);
  world.setPullCam(false);
  world.dealer.setMood('idle');
  world.dealer.setTell(false);
  sync();
  hud.focusPlay();
}

function menu() {
  clearTimers();
  acting = false;
  state = null;
  hud.showMenu();
  hud.clearBlackout();
  hud.clearSplat();
  if (world) world.clearFx();
  hud.setAim(false);
  if (world) {
    world.setGunPose('table');
    world.setPullCam(false);
    world.dealer.setMood('idle');
    world.dealer.setTell(false);
  }
  paintScene();
}

function toggleMute() {
  audio.setMuted(!audio.muted);
  hud.setMuted(audio.muted);
  if (!audio.muted) audio.click();
}

const hud = createHud({
  onStart: start,
  onSpin: doSpin,
  onPull: doPull,
  onShoot: doShoot,
  onPass: doPass,
  onItem: doItem,
  onCash: doCash,
  onFinish: (name) => { if (world) world.setFinish(name); },
  onAgain: again,
  onNext: goNext,
  onMenu: menu,
  onMute: toggleMute,
});
hud.setMuted(audio.muted);
hud.setBoot('LIGHTING THE TABLE…');
hud.setModesEnabled(false);

document.addEventListener('pointerdown', () => audio.unlock(), { once: true });

document.addEventListener('keydown', (e) => {
  if (isMuteKey(e.code)) {
    toggleMute();
    return;
  }
  if (!state) {
    const mode = hud.adult ? modeFromMenuKey(e.key) : null;
    if (mode) start(mode);
    return;
  }
  if (isPrimaryKey(e.code)) {
    e.preventDefault();
    const act = spaceAction(state);
    if (act === 'next') goNext();
    else if (act === 'again') again();
    else if (act === 'spin') doSpin();
    else if (act === 'pull') doPull();
  } else if (isMenuKey(e.code)) {
    menu();
  } else if (isCashKey(e.code)) {
    doCash();
  } else if (isShootKey(e.code)) {
    doShoot();
  } else if (isPassKey(e.code)) {
    doPass();
  } else if (isRespinKey(e.code)) {
    if (state.playerItems.includes(ITEMS.respin)) doItem(ITEMS.respin);
  } else {
    const item = itemFromDigit(state, e.key);
    if (item) doItem(item);
  }
});

// Table touch: swipe or tap the drum to spin, press-and-hold to pull.
// Routing lives in game/gesture.js (Node-tested) so HOUSE's turn is safe.
const press = { id: null, x: 0, y: 0, t: 0, raf: 0, fired: false, holding: false };

function cancelHold() {
  if (press.raf) cancelAnimationFrame(press.raf);
  press.raf = 0;
  press.holding = false;
  hud.setHold(0);
  if (world && !acting) world.setTension(0);
}

function holdTick(now) {
  if (!press.holding) return;
  if (!canHoldToPull(state) || acting) {
    cancelHold();
    return;
  }
  const p = Math.min(1, (now - press.t) / HOLD_MS);
  hud.setHold(p);
  world.setTension(p * 0.6);
  if (p >= 1) {
    press.fired = true;
    press.holding = false;
    press.raf = 0;
    hud.setHold(1);
    if (tableAction(state, 'hold') === 'pull') {
      buzz(20);
      doPull();
    }
    later(260, () => hud.setHold(0));
    return;
  }
  press.raf = requestAnimationFrame(holdTick);
}

canvas.addEventListener('pointerdown', (e) => {
  if (!state || !world || press.id !== null) return;
  audio.unlock();
  press.id = e.pointerId;
  press.x = e.clientX;
  press.y = e.clientY;
  press.t = performance.now();
  press.fired = false;
  try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  if (canHoldToPull(state) && !acting) {
    press.holding = true;
    hud.setHold(0.001, e.clientX, e.clientY);
    buzz(6);
    press.raf = requestAnimationFrame(holdTick);
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== press.id || !press.holding) return;
  if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > TAP_MAX_PX) cancelHold();
});

function endPress(e, cancelled) {
  if (e.pointerId !== press.id) return;
  press.id = null;
  const wasHolding = press.holding;
  cancelHold();
  if (cancelled || press.fired || !state) return;
  const gesture = classifyGesture({
    dx: e.clientX - press.x,
    dy: e.clientY - press.y,
    ms: performance.now() - press.t,
  });
  if (wasHolding && gesture === 'tap') return;
  if (tableAction(state, gesture) === 'spin') doSpin();
}
canvas.addEventListener('pointerup', (e) => endPress(e, false));
canvas.addEventListener('pointercancel', (e) => endPress(e, true));
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('visibilitychange', () => {
  hidden = document.hidden;
  // If the tab slept mid-HOUSE-turn, timers may have been throttled. Re-queue.
  if (!hidden && state && world && state.aiTurn && !state.over && state.spun && !acting) {
    queueAi();
  }
});

const clock = { last: 0 };
function frame(now) {
  const dt = clock.last ? Math.min(0.05, (now - clock.last) / 1000) : 0.016;
  clock.last = now;
  if (world && !hidden) {
    world.update(dt, now);
    world.render();
  }
  requestAnimationFrame(frame);
}

async function boot() {
  try {
    const { createWorld } = await import('./scene/world.js');
    world = createWorld(canvas);
    hud.applyFinish();
    world.gun.onLand(() => {
      world.feel.kick('land');
      if (state && state.spun) audio.land();
    });
    hud.setBoot('');
    hud.setModesEnabled(true);
    requestAnimationFrame(frame);
    if (pendingMode) start(pendingMode);
  } catch (err) {
    hud.setBoot('TABLE FAILED TO LIGHT — RELOAD');
    hud.setModesEnabled(false);
    console.error(err);
  }
}

window.__chamber = {
  get state() { return state; },
  get ready() { return Boolean(world); },
  get world() { return world; },
  start,
  spin: doSpin,
  pull: doPull,
  cash: doCash,
};

boot();
