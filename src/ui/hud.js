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
        <span>SAFE <strong id="surv">0</strong></span>
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
      <div class="actions">
        <button type="button" id="spinBtn">SPIN</button>
        <button type="button" id="fireBtn" disabled>PULL</button>
        <button type="button" id="nextBtn" class="hidden">NEXT ROUND</button>
        <button type="button" id="againBtn" class="hidden">PLAY AGAIN</button>
        <button type="button" id="menuBtn" class="ghost">MENU</button>
      </div>
      <div id="itemBar" class="items"></div>
    </section>

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
  const itemBar = $('itemBar');
  const muteBtn = $('muteBtn');

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
    render(state) {
      status.textContent = state.status;
      status.classList.toggle('bang', state.last?.type === 'hit' && state.over);
      surv.textContent = String(state.survived);
      odds.textContent = `ODDS 1/${oddsDenom(state)}`;

      const ai = state.mode === 'ai';
      kits.classList.toggle('hidden', !ai);
      match.classList.toggle('hidden', !ai);
      round.classList.toggle('hidden', !ai);
      if (ai) {
        match.textContent = `YOU ${state.playerRoundWins} — ${state.aiRoundWins} HOUSE`;
        round.textContent = `R${state.round}/3`;
        chips(youKit, state.playerItems, false);
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
      spinBtn.disabled = !playable || state.spun;
      fireBtn.disabled = !playable || !state.spun;
      spinBtn.classList.toggle('hidden', state.over || state.matchOver);
      fireBtn.classList.toggle('hidden', state.over || state.matchOver);
      nextBtn.classList.toggle('hidden', !(state.over && ai && !state.matchOver));
      againBtn.classList.toggle('hidden', !(state.over && (state.mode !== 'ai' || state.matchOver)));

      itemBar.textContent = '';
      if (ai && playable && state.spun && state.playerItems.length) {
        state.playerItems.forEach((item) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'chip use';
          b.textContent = ITEM_LABEL[item];
          b.addEventListener('click', () => onItem(item));
          itemBar.appendChild(b);
        });
      }
    },
  };
}
