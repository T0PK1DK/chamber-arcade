import { createMatch, resetMatch, spin, pull, useItem, nextRound, canSpin, canPull } from './game/logic.js';
import { decideAi } from './game/ai.js';
import { createAudio } from './game/audio.js';
import { saveBest, recordAiMatch } from './game/storage.js';
import { createWorld } from './scene/world.js';
import { createHud } from './ui/hud.js';

const canvas = document.getElementById('stage');
const world = createWorld(canvas);
const audio = createAudio();

let state = null;
let recordedMatch = false;
let acting = false;
let hidden = false;
const timers = [];

function later(ms, fn) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

function clearTimers() {
  timers.splice(0).forEach(clearTimeout);
}

function paintScene() {
  if (!state) {
    world.cylinder.paint({ spun: false, over: false, current: 0, bullet: -1, peek: null, reveal: false });
    world.dealer.setMood('idle');
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
}

function sync() {
  hud.render(state);
  paintScene();
}

function lockButtons() {
  acting = true;
}

function unlockButtons() {
  acting = false;
}

function afterHit(result) {
  world.kick('bang');
  world.setPullCam(true);
  world.dealer.setMood('bang');
  audio.bang();
  if (navigator.vibrate) {
    try { navigator.vibrate([50, 30, 90]); } catch { /* ignore */ }
  }
  if (state.mode !== 'ai') {
    if (saveBest(state.mode, state.survived)) {
      state.status = `OUT — NEW BEST ${state.survived}`;
    }
  } else if (state.matchOver && !recordedMatch) {
    recordedMatch = true;
    recordAiMatch(state.playerRoundWins > state.aiRoundWins);
    world.dealer.setMood(state.playerRoundWins > state.aiRoundWins ? 'bang' : 'win');
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

function resolvePull() {
  const result = pull(state);
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

function doPull() {
  if (!state || acting) return;
  if (!canPull(state) && !(state.mode === 'ai' && state.aiTurn && state.spun && !state.over)) return;
  lockButtons();
  world.setPullCam(true);
  world.dealer.setMood(state.aiTurn ? 'pull' : 'think');
  audio.tick();
  later(380, resolvePull);
}

function doSpin() {
  if (!state || acting || !canSpin(state)) return;
  const result = spin(state);
  if (!result.ok) return;
  audio.spin();
  world.cylinder.kickSpin();
  world.cylinder.land(state.current);
  world.dealer.setMood('idle');
  sync();
}

function doItem(item) {
  if (!state || acting) return;
  const result = useItem(state, item, 'player');
  if (!result.ok) return;
  audio.item();
  world.dealer.setMood('think');
  if (result.item === 'rack') world.cylinder.land(state.current);
  sync();
}

function queueAi() {
  later(520, () => {
    if (!state || !state.aiTurn || state.over) return;
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
    doPull();
  });
}

function start(mode) {
  clearTimers();
  recordedMatch = false;
  acting = false;
  state = createMatch(mode);
  hud.showGame();
  world.cylinder.setIndex(0, true);
  world.setPullCam(false);
  world.dealer.setMood('idle');
  audio.unlock();
  sync();
}

function again() {
  if (!state) return;
  clearTimers();
  recordedMatch = false;
  acting = false;
  resetMatch(state);
  world.cylinder.setIndex(0, true);
  world.setPullCam(false);
  world.dealer.setMood('idle');
  sync();
}

function goNext() {
  if (!state) return;
  clearTimers();
  acting = false;
  if (!nextRound(state).ok) return;
  world.cylinder.setIndex(0, true);
  world.setPullCam(false);
  world.dealer.setMood('idle');
  sync();
}

function menu() {
  clearTimers();
  acting = false;
  state = null;
  hud.showMenu();
  world.setPullCam(false);
  world.dealer.setMood('idle');
  paintScene();
}

const hud = createHud({
  onStart: start,
  onSpin: doSpin,
  onPull: doPull,
  onItem: doItem,
  onAgain: again,
  onNext: goNext,
  onMenu: menu,
  onMute() {
    audio.setMuted(!audio.muted);
    hud.setMuted(audio.muted);
    if (!audio.muted) audio.click();
  },
});
hud.setMuted(audio.muted);

document.addEventListener('pointerdown', () => audio.unlock(), { once: true });

document.addEventListener('keydown', (e) => {
  if (!state) return;
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (state.over && state.mode === 'ai' && !state.matchOver) goNext();
    else if (state.over) again();
    else if (canSpin(state)) doSpin();
    else doPull();
  } else if (e.code === 'Escape') {
    menu();
  } else if (e.code === 'KeyM') {
    audio.setMuted(!audio.muted);
    hud.setMuted(audio.muted);
  } else if (state.playerItems[e.key - 1]) {
    doItem(state.playerItems[e.key - 1]);
  }
});

document.addEventListener('visibilitychange', () => {
  hidden = document.hidden;
});

window.addEventListener('resize', () => world.resize());

const clock = { last: performance.now() };
function frame(now) {
  const dt = Math.min(0.05, (now - clock.last) / 1000);
  clock.last = now;
  if (!hidden) {
    world.update(dt, now);
    world.render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__chamber = {
  get state() { return state; },
  start,
  spin: doSpin,
  pull: doPull,
};
