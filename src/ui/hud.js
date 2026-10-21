import { ITEMS, oddsDenom } from '../game/logic.js';
import { loadScores } from '../game/storage.js';

const ITEM_LABEL = {
  [ITEMS.scope]: 'SCOPE',
  [ITEMS.rack]: 'RACK',
  [ITEMS.stun]: 'STUN',
};

const ITEM_HINT = {
  [ITEMS.scope]: 'Peek this chamber',
  [ITEMS.rack]: 'Eject this chamber',
  [ITEMS.stun]: 'Skip HOUSE next pull',
};

export function createHud({ onStart, onSpin, onPull, onItem, onAgain, onNext, onMenu, onMute }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="top">
      <div class="brand">
        <strong>CHAMBER</strong>
        <span>// ARCADE</span>
      </div>
      <button type="button" id="muteBtn" class="ghost" aria-pressed="false">SOUND: ON</button>
    </header>

    <p id="bootLine" class="boot" hidden>LIGHTING THE TABLE…</p>

    <section id="menu" class="panel menu active" aria-label="Choose mode">
      <h1>CHAMBER</h1>
      <p class="sub">CRT TABLE · TOY DRUM · NO REAL RISK</p>
      <div class="modes">
        <button type="button" data-mode="fair" aria-keyshortcuts="1">FAIR<span>Always 1/6. Re-spin every pull. Key 1</span></button>
        <button type="button" data-mode="classic" aria-keyshortcuts="2">CLASSIC<span>One load. Odds rise as chambers empty. Key 2</span></button>
        <button type="button" data-mode="ai" aria-keyshortcuts="3">VS HOUSE<span>Best of 3. Shared drum. Arcade chips. Key 3</span></button>
      </div>
      <p class="high">BEST — FAIR <strong id="bestFair">0</strong> · CLASSIC <strong id="bestClassic">0</strong></p>
      <p class="record">VS HOUSE <strong id="aiRec">0-0</strong></p>
    </section>

    <section id="hud" class="hud hidden" aria-live="off">
      <div class="banner">
        <p id="turn" class="turn"></p>
        <p id="status" class="status" role="status" aria-live="polite" aria-atomic="true">READY</p>
        <p id="match" class="match"></p>
      </div>
      <div class="stats">
        <span>SAFE <strong id="surv" class="pop">0</strong></span>
        <span id="odds">ODDS 1/6</span>
        <span id="round"></span>
      </div>
      <div id="kits" class="kits hidden">
        <div>
          <small>YOU</small>
          <div id="youKit" class="chips"></div>
        </div>
        <div>
          <small>HOUSE</small>
          <div id="houseKit" class="chips"></div>
        </div>
      </div>
      <p id="hint" class="hint" aria-hidden="true"></p>
      <div class="actions">
        <button type="button" id="menuBtn" class="ghost side" aria-label="Menu">MENU</button>
        <button type="button" id="spinBtn" class="primary">SPIN</button>
        <button type="button" id="fireBtn" class="primary pull hidden" disabled>PULL</button>
        <button type="button" id="nextBtn" class="primary hidden">NEXT ROUND</button>
        <button type="button" id="againBtn" class="primary hidden">PLAY AGAIN</button>
      </div>
    </section>

    <div id="holdRing" class="hold-ring" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27"/><circle class="fill" cx="32" cy="32" r="27" pathLength="100"/></svg><span>HOLD</span></div>

    <p class="disclaimer">SIMULATION ONLY — TOY DRUM — NO REAL FIREARMS.</p>
  `;

  const $ = (id) => document.getElementById(id);
  const menu = $('menu');
  const hud = $('hud');
  const bootLine = $('bootLine');
  const status = $('status');
  const turn = $('turn');
  const match = $('match');
  const surv = $('surv');
  const odds = $('odds');
  const round = $('round');
  const kits = $('kits');
  const youKit = $('youKit');
  const houseKit = $('houseKit');
  const spinBtn = $('spinBtn');
  const fireBtn = $('fireBtn');
  const nextBtn = $('nextBtn');
  const againBtn = $('againBtn');
  const muteBtn = $('muteBtn');
  const hint = $('hint');
  const holdRing = $('holdRing');
  const holdFill = holdRing.querySelector('.fill');
  const flashEl = document.getElementById('flash');

  menu.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => onStart(btn.dataset.mode));
  });
  spinBtn.addEventListener('click', onSpin);
  fireBtn.addEventListener('click', onPull);
  nextBtn.addEventListener('click', onNext);
  againBtn.addEventListener('click', onAgain);
  $('menuBtn').addEventListener('click', onMenu);
  muteBtn.addEventListener('click', onMute);

  function paintScores() {
    const s = loadScores();
    $('bestFair').textContent = s.fair;
    $('bestClassic').textContent = s.classic;
    $('aiRec').textContent = `${s.aiWins}-${s.aiLosses}`;
  }
  paintScores();

  // Restart a CSS keyframe on the same element (status pop, streak bump).
  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function chips(el, items, interactive) {
    el.textContent = '';
    if (!items.length) {
      const empty = document.createElement('em');
      empty.className = 'empty';
      empty.textContent = '—';
      el.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const b = document.createElement(interactive ? 'button' : 'span');
      b.className = 'chip';
      b.textContent = ITEM_LABEL[item];
      b.title = ITEM_HINT[item] || '';
      if (interactive) {
        b.type = 'button';
        b.classList.add('use');
        b.setAttribute('aria-label', `${ITEM_LABEL[item]}: ${ITEM_HINT[item]}`);
        b.addEventListener('click', () => onItem(item));
      }
      el.appendChild(b);
    });
  }

  function focusPlay() {
    const target = !spinBtn.disabled && !spinBtn.classList.contains('hidden')
      ? spinBtn
      : !fireBtn.disabled && !fireBtn.classList.contains('hidden')
        ? fireBtn
        : !nextBtn.classList.contains('hidden')
          ? nextBtn
          : !againBtn.classList.contains('hidden')
            ? againBtn
            : null;
    target?.focus({ preventScroll: true });
  }

  return {
    paintScores,
    setMuted(muted) {
      muteBtn.textContent = `SOUND: ${muted ? 'OFF' : 'ON'}`;
      muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    },
    setBoot(msg) {
      if (!msg) {
        bootLine.hidden = true;
        return;
      }
      bootLine.hidden = false;
      bootLine.textContent = msg;
    },
    setModesEnabled(on) {
      menu.querySelectorAll('[data-mode]').forEach((btn) => {
        btn.disabled = !on;
      });
    },
    showMenu() {
      menu.classList.add('active');
      hud.classList.add('hidden');
      paintScores();
      menu.querySelector('[data-mode]')?.focus({ preventScroll: true });
    },
    showGame() {
      menu.classList.remove('active');
      hud.classList.remove('hidden');
    },
    focusPlay,
    /** 0 hides the ring; (0,1] shows it at the pointer, filled that far. */
    setHold(progress, x, y) {
      if (!progress) {
        holdRing.classList.remove('on', 'full');
        return;
      }
      if (x != null) {
        holdRing.style.left = `${x}px`;
        holdRing.style.top = `${y}px`;
      }
      holdRing.classList.add('on');
      holdRing.classList.toggle('full', progress >= 1);
      holdFill.style.strokeDashoffset = String(100 - Math.min(1, progress) * 100);
    },
    /** Full-screen tint: 'bang' | 'safe' | 'win'. CSS keeps it short. */
    flash(kind) {
      if (!flashEl) return;
      flashEl.className = '';
      void flashEl.offsetWidth;
      flashEl.className = `on ${kind}`;
    },
    render(state) {
      if (status.textContent !== state.status) {
        status.textContent = state.status;
        replay(status, 'pop');
      }
      const hit = state.last?.type === 'hit' && state.over;
      const won = hit && state.winner === 'player';
      status.classList.toggle('bang', hit && !won);
      status.classList.toggle('win', won);
      const safe = String(state.survived);
      if (surv.textContent !== safe) {
        surv.textContent = safe;
        if (state.survived > 0) replay(surv, 'bump');
      }
      const denom = oddsDenom(state);
      odds.textContent = `ODDS 1/${denom}`;
      odds.classList.toggle('warn', state.spun && !state.over && denom <= 3 && denom > 1);
      odds.classList.toggle('danger', state.spun && !state.over && denom <= 1);

      const ai = state.mode === 'ai';
      kits.classList.toggle('hidden', !ai);
      match.classList.toggle('hidden', !ai);
      round.classList.toggle('hidden', !ai);
      if (ai) {
        match.textContent = `YOU ${state.playerRoundWins} — ${state.aiRoundWins} HOUSE`;
        round.textContent = `R${state.round}/3`;
        const usable = !state.over && !state.matchOver && !state.busy && !state.aiTurn && state.spun;
        chips(youKit, state.playerItems, usable);
        chips(houseKit, state.aiItems, false);
        if (!state.over && !state.aiTurn) {
          turn.textContent = state.spun ? 'YOUR TURN' : 'LOAD THE DRUM';
          turn.classList.remove('ai');
        } else if (!state.over) {
          turn.textContent = 'HOUSE TURN';
          turn.classList.add('ai');
        } else {
          turn.textContent = state.matchOver ? 'MATCH OVER' : 'ROUND OVER';
          turn.classList.remove('ai');
        }
      } else {
        turn.textContent = '';
        match.textContent = '';
      }

      const playable = !state.over && !state.matchOver && !state.busy && !(ai && state.aiTurn);
      // One big thumb button that morphs SPIN → PULL instead of two
      // side-by-side where one is always greyed out.
      const done = state.over || state.matchOver;
      spinBtn.disabled = !playable || state.spun;
      fireBtn.disabled = !playable || !state.spun;
      spinBtn.classList.toggle('hidden', done || state.spun);
      fireBtn.classList.toggle('hidden', done || !state.spun);
      nextBtn.classList.toggle('hidden', !(state.over && ai && !state.matchOver));
      againBtn.classList.toggle('hidden', !(state.over && (state.mode !== 'ai' || state.matchOver)));

      hint.textContent = !playable
        ? ''
        : state.spun ? 'OR HOLD THE TABLE TO PULL' : 'OR SWIPE THE DRUM TO SPIN';
    },
  };
}
