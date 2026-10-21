import { createMatch, resetMatch, spin, pull, useItem, nextRound, canSpin, canPull } from './game/logic.js';
import { decideAi } from './game/ai.js';
import { createAudio } from './game/audio.js';
import { saveBest, recordAiMatch } from './game/storage.js';
import {
  itemFromDigit,
  isMenuKey,
  isMuteKey,
  isPrimaryKey,
  modeFromMenuKey,
  spaceAction,
} from './game/input.js';
import { createHud } from './ui/hud.js';

const canvas = document.getElementById('stage');
const audio = createAudio();

let world = null;
let state = null;
let recordedMatch = false;
let acting = false;
let hidden = false;
let pendingMode = null;
const timers = [];

function later(ms, fn) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

function clearTimers() {
  timers.splice(0).forEach(clearTimeout);
  audio.hush();
}

function paintScene() {
  if (!world) return;
  if (!state) {
    world.cylinder.paint({ spun: false, over: false, current: 0, bullet: -1, peek: null, reveal: false });
    world.dealer.setMood('idle');
    world.dealer.setTell(false);
    world.kits.paint(null);
    return;
  }
  world.cylinder.paint({
    spun: state.spun,
    over: state.over,
    current: state.current,
    bullet: state.bullet,
    peek: state.peek,
    reveal: state.over && state.last?.type === 'hit',
  });
  world.dealer.setTell(state.tell);
  world.kits.paint(state);
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

function afterHit() {
  world.kick('bang');
  world.setPullCam(true);
  audio.bang();
  if (navigator.vibrate) {
    try { navigator.vibrate([50, 30, 90]); } catch { /* ignore */ }
  }
  if (state.mode !== 'ai') {
    world.dealer.setMood('bang');
    if (saveBest(state.mode, state.survived)) {
      state.status = `OUT — NEW BEST ${state.survived}`;
    }
  } else {
    world.dealer.setMood(state.winner === 'ai' ? 'win' : 'bang');
    if (state.matchOver && !recordedMatch) {
      recordedMatch = true;
      recordAiMatch(state.playerRoundWins > state.aiRoundWins);
    }
  }
  later(700, () => world.setPullCam(false));
}

function afterClick(result) {
  world.kick('click');
  world.dealer.setMood(result.byAi ? 'click' : 'idle');
  audio.click();
  world.cylinder.setIndex(state.current);
  later(420, () => world.setPullCam(false));
  if (state.mode === 'ai' && state.aiTurn) queueAi();
}

function resolvePull(who) {
  if (!state || !world) {
    unlockButtons();
    return;
  }
  const result = pull(state, who);
  unlockButtons();
  if (!result.ok) {
    world.setPullCam(false);
    sync();
    return;
  }
  if (result.hit) afterHit(result);
  else afterClick(result);
  sync();
}

function beginPull(who) {
  if (!state || !world || acting) return false;
  if (who === 'player' && !canPull(state, 'player')) return false;
  if (who === 'ai' && !canPull(state, 'ai')) return false;
  lockButtons();
  world.setPullCam(true);
  world.dealer.setMood(state.aiTurn ? 'pull' : 'think');
  audio.tick();
  later(380, () => resolvePull(who));
  return true;
}

function doPull() {
  beginPull('player');
}

function doSpin() {
  if (!state || !world || acting || !canSpin(state)) return;
  const result = spin(state);
  if (!result.ok) return;
  audio.spin();
  world.cylinder.kickSpin();
  world.cylinder.land(state.current);
  world.dealer.setMood('idle');
  world.dealer.setTell(false);
  sync();
}

function doItem(item) {
  if (!state || !world || acting) return;
  const result = useItem(state, item, 'player');
  if (!result.ok) return;
  audio.item();
  world.dealer.setMood('think');
  if (result.item === 'rack') world.cylinder.land(state.current);
  sync();
}

function queueAi() {
  later(520, () => {
    if (!state || !state.aiTurn || state.over || !world) return;
    const choice = decideAi(state);
    if (choice.type === 'item') {
      useItem(state, choice.item, 'ai');
      audio.item();
      world.dealer.setMood('think');
      if (choice.item === 'rack') world.cylinder.land(state.current);
      sync();
      if (state.spun && state.aiTurn) later(640, queueAi);
      return;
    }
    beginPull('ai');
  });
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
  hud.showGame();
  world.cylinder.setIndex(0, true);
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
  world.cylinder.setIndex(0, true);
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
  world.cylinder.setIndex(0, true);
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
  if (world) {
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
  onItem: doItem,
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
    const mode = modeFromMenuKey(e.key);
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
  } else {
    const item = itemFromDigit(state, e.key);
    if (item) doItem(item);
  }
});

document.addEventListener('visibilitychange', () => {
  hidden = document.hidden;
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
  start,
  spin: doSpin,
  pull: doPull,
};

boot();
