import { CHAMBERS, ITEMS, STAKE, canCashOut, oddsDenom } from '../game/logic.js';
import { loadScores, loadAdultOk, saveAdultOk, loadBigText, saveBigText } from '../game/storage.js';

const ITEM_LABEL = {
  [ITEMS.scope]: 'PEEK',
  [ITEMS.rack]: 'EJECT',
  [ITEMS.stun]: 'SKIP',
  [ITEMS.respin]: 'RE-SPIN',
};

const ITEM_HINT = {
  [ITEMS.scope]: 'Look at this chamber',
  [ITEMS.rack]: 'Eject this chamber',
  [ITEMS.stun]: 'HOUSE skips their next pull',
  [ITEMS.respin]: 'Spin the cylinder again. Odds go back to 1 in 6.',
};

const money = (n) => `$${n.toLocaleString('en-US')}`;

export function createHud({ onStart, onSpin, onPull, onItem, onCash, onAgain, onNext, onMenu, onMute }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="top">
      <div class="brand">
        <strong>CHAMBER</strong>
        <span>Russian Roulette</span>
      </div>
      <div class="top-btns">
        <button type="button" id="textBtn" class="ghost" aria-pressed="false" aria-label="Larger text">A+</button>
        <button type="button" id="muteBtn" class="ghost" aria-pressed="false">SOUND ON</button>
      </div>
    </header>

    <p id="bootLine" class="boot" hidden>Lighting the table…</p>

    <section id="gate" class="panel gate" aria-labelledby="gateTitle" hidden>
      <h1 id="gateTitle">18+</h1>
      <p class="lead">This is a game of Russian roulette with a revolver.</p>
      <p>It's played for nerve and play money only. No one is hurt, and there's no gore.</p>
      <div class="gate-btns">
        <button type="button" id="gateYes" class="primary">I'M 18 OR OLDER</button>
        <a class="button ghost" href="https://www.google.com/">LEAVE</a>
      </div>
      <p class="care">Having a hard time? In the US, call or text <strong>988</strong>, any hour. Elsewhere, contact your local crisis line.</p>
    </section>

    <section id="menu" class="panel menu" aria-label="Choose a game">
      <h1>CHAMBER</h1>
      <p class="sub">Six chambers · One round · Your nerve</p>
      <div class="modes">
        <button type="button" data-mode="classic" aria-keyshortcuts="2">ONE SPIN<span>Spin once, then keep pulling. Each empty chamber raises the odds and grows the pot faster. Walk away any time.</span></button>
        <button type="button" data-mode="fair" aria-keyshortcuts="1">SPIN EVERY PULL<span>The cylinder is spun before every pull. Always 1 in 6. Steady money.</span></button>
        <button type="button" data-mode="ai" aria-keyshortcuts="3">DUEL THE HOUSE<span>Pass the revolver back and forth. Best of three. One re-spin each per round.</span></button>
      </div>
      <p class="high">BEST CASH-OUT · One spin <strong id="bestClassic">$0</strong> · Every pull <strong id="bestFair">$0</strong></p>
      <p class="record">DUELS WON–LOST <strong id="aiRec">0–0</strong></p>
      <details class="rules">
        <summary>How to play</summary>
        <ul>
          <li>The revolver holds six chambers and <strong>one</strong> round.</li>
          <li><strong>Spin</strong> the cylinder, then <strong>pull</strong> the trigger. An empty chamber clicks, and you're still in.</li>
          <li>Solo games start with a ${money(STAKE)} stake. Every safe pull raises the pot at fair odds. <strong>Cash out</strong> whenever you like. If you hit the round, the pot is gone.</li>
          <li>In <strong>One Spin</strong>, the odds go 1 in 6, then 1 in 5, and so on. After five clicks the last chamber is the live one.</li>
          <li>In a <strong>Duel</strong>, you and HOUSE take turns. Whoever hits the round loses the round. Once per round you may <strong>re-spin</strong> before your pull.</li>
          <li>Keys: <kbd>Space</kbd> spin / pull · <kbd>C</kbd> cash out · <kbd>R</kbd> re-spin · <kbd>Esc</kbd> menu · <kbd>M</kbd> sound.</li>
          <li>On a phone: swipe the table to spin, and press and hold it to pull.</li>
        </ul>
      </details>
    </section>

    <section id="hud" class="hud hidden" aria-live="off">
      <div class="banner">
        <p id="turn" class="turn"></p>
        <p id="status" class="status" role="status" aria-live="polite" aria-atomic="true">READY</p>
        <p id="match" class="match"></p>
      </div>
      <div class="dial-row">
        <div id="dial" class="dial" role="img" aria-label="Cylinder"></div>
        <div class="readout">
          <p id="odds" class="odds">1 IN 6</p>
          <p class="money"><span id="potLabel">POT</span> <strong id="pot">$0</strong></p>
          <p class="safe">Safe pulls <strong id="surv" class="pop">0</strong><span id="round"></span></p>
        </div>
      </div>
      <div id="kits" class="kits hidden">
        <div><small>YOU</small><div id="youKit" class="chips"></div></div>
        <div><small>HOUSE</small><div id="houseKit" class="chips"></div></div>
      </div>
      <p id="hint" class="hint" aria-hidden="true"></p>
      <div class="actions">
        <button type="button" id="menuBtn" class="ghost side" aria-label="Menu">MENU</button>
        <button type="button" id="cashBtn" class="cash hidden">CASH OUT</button>
        <button type="button" id="spinBtn" class="primary">SPIN</button>
        <button type="button" id="fireBtn" class="primary pull hidden" disabled>PULL THE TRIGGER</button>
        <button type="button" id="nextBtn" class="primary hidden">NEXT ROUND</button>
        <button type="button" id="againBtn" class="primary hidden">PLAY AGAIN</button>
      </div>
    </section>

    <div id="holdRing" class="hold-ring" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27"/><circle class="fill" cx="32" cy="32" r="27" pathLength="100"/></svg><span>HOLD</span></div>

    <p class="disclaimer">A GAME OF CHANCE · PLAY MONEY · 18+ · NO GORE</p>
  `;

  const $ = (id) => document.getElementById(id);
  const gate = $('gate');
  const menu = $('menu');
  const hud = $('hud');
  const bootLine = $('bootLine');
  const status = $('status');
  const turn = $('turn');
  const match = $('match');
  const surv = $('surv');
  const odds = $('odds');
  const pot = $('pot');
  const potLabel = $('potLabel');
  const round = $('round');
  const dial = $('dial');
  const kits = $('kits');
  const youKit = $('youKit');
  const houseKit = $('houseKit');
  const spinBtn = $('spinBtn');
  const fireBtn = $('fireBtn');
  const cashBtn = $('cashBtn');
  const nextBtn = $('nextBtn');
  const againBtn = $('againBtn');
  const muteBtn = $('muteBtn');
  const textBtn = $('textBtn');
  const hint = $('hint');
  const holdRing = $('holdRing');
  const holdFill = holdRing.querySelector('.fill');
  const flashEl = document.getElementById('flash');
  const blackEl = document.getElementById('blackout');

  const pips = [];
  for (let i = 0; i < CHAMBERS; i += 1) {
    const pip = document.createElement('span');
    const a = (i / CHAMBERS) * Math.PI * 2 - Math.PI / 2;
    pip.style.left = `${50 + Math.cos(a) * 34}%`;
    pip.style.top = `${50 + Math.sin(a) * 34}%`;
    dial.appendChild(pip);
    pips.push(pip);
  }

  let adult = loadAdultOk();
  function applyGate() {
    gate.hidden = adult;
    menu.classList.toggle('active', adult && hud.classList.contains('hidden'));
  }
  $('gateYes').addEventListener('click', () => {
    adult = true;
    saveAdultOk();
    applyGate();
    menu.querySelector('[data-mode]')?.focus({ preventScroll: true });
  });

  function setBigText(on) {
    document.documentElement.classList.toggle('big', on);
    textBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    textBtn.textContent = on ? 'A−' : 'A+';
    textBtn.setAttribute('aria-label', on ? 'Normal text' : 'Larger text');
  }
  setBigText(loadBigText());
  textBtn.addEventListener('click', () => {
    const on = !document.documentElement.classList.contains('big');
    saveBigText(on);
    setBigText(on);
  });

  menu.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => onStart(btn.dataset.mode));
  });
  spinBtn.addEventListener('click', onSpin);
  fireBtn.addEventListener('click', onPull);
  cashBtn.addEventListener('click', onCash);
  nextBtn.addEventListener('click', onNext);
  againBtn.addEventListener('click', onAgain);
  $('menuBtn').addEventListener('click', onMenu);
  muteBtn.addEventListener('click', onMute);

  function paintScores() {
    const s = loadScores();
    $('bestFair').textContent = money(s.fairCash);
    $('bestClassic').textContent = money(s.classicCash);
    $('aiRec').textContent = `${s.aiWins}–${s.aiLosses}`;
  }
  paintScores();
  applyGate();

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
      empty.textContent = 'used';
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

  function paintDial(state) {
    // Spent chambers (already clicked) go hollow; the one under the hammer is ringed.
    const spent = state.mode === 'fair' || !state.spun ? 0 : state.pulls;
    const reveal = state.over && state.last?.type === 'hit';
    pips.forEach((pip, i) => {
      pip.className = '';
      if (i < spent) pip.classList.add('spent');
      if (state.spun && !state.over && i === spent) pip.classList.add('next');
      if (reveal && i === (state.mode === 'fair' ? 0 : spent - 1)) pip.classList.add('live');
    });
    const left = CHAMBERS - spent;
    dial.setAttribute('aria-label', `${left} of 6 chambers left`);
  }

  function focusPlay() {
    const target = [spinBtn, fireBtn, nextBtn, againBtn]
      .find((b) => !b.disabled && !b.classList.contains('hidden'));
    target?.focus({ preventScroll: true });
  }

  return {
    paintScores,
    get adult() {
      return adult;
    },
    setMuted(muted) {
      muteBtn.textContent = `SOUND ${muted ? 'OFF' : 'ON'}`;
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
      hud.classList.add('hidden');
      applyGate();
      paintScores();
      if (adult) menu.querySelector('[data-mode]')?.focus({ preventScroll: true });
    },
    showGame() {
      menu.classList.remove('active');
      hud.classList.remove('hidden');
    },
    focusPlay,
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
    flash(kind) {
      if (!flashEl) return;
      flashEl.className = '';
      void flashEl.offsetWidth;
      flashEl.className = `on ${kind}`;
    },
    /** Hard cut to black when you take the round; fades back after `ms`. */
    blackout(ms) {
      if (!blackEl) return;
      blackEl.className = 'on';
      setTimeout(() => { blackEl.className = 'fade'; }, ms);
    },
    /** Tunnel vision while the revolver is at your temple. */
    setAim(on) {
      document.body.classList.toggle('aim', Boolean(on));
    },
    clearBlackout() {
      if (blackEl) blackEl.className = '';
    },
    render(state) {
      if (status.textContent !== state.status) {
        status.textContent = state.status;
        replay(status, 'pop');
      }
      const hit = state.last?.type === 'hit' && state.over;
      const won = (hit && state.winner === 'player') || state.winner === 'cash';
      status.classList.toggle('bang', hit && !won);
      status.classList.toggle('win', won);
      const safe = String(state.survived);
      if (surv.textContent !== safe) {
        surv.textContent = safe;
        if (state.survived > 0) replay(surv, 'bump');
      }
      const denom = oddsDenom(state);
      const live = state.spun && !state.over;
      odds.textContent = !state.spun && !state.over
        ? 'SPIN TO LOAD'
        : state.over ? '' : denom <= 1 ? 'THE NEXT ONE IS LIVE' : `1 IN ${denom} IS LIVE`;
      odds.classList.toggle('warn', live && denom <= 3 && denom > 1);
      odds.classList.toggle('danger', live && denom <= 1);
      paintDial(state);

      const ai = state.mode === 'ai';
      const shownPot = state.winner === 'cash' ? state.cashed : state.pot;
      potLabel.textContent = ai ? 'SCORE'
        : state.winner === 'cash' ? 'BANKED'
          : state.over ? 'TAKE-HOME'
            : state.survived ? 'POT' : 'STAKE';
      pot.textContent = ai
        ? `${state.playerRoundWins}–${state.aiRoundWins}`
        : money(shownPot || (state.over ? 0 : STAKE));

      kits.classList.toggle('hidden', !ai);
      match.classList.toggle('hidden', !ai);
      round.textContent = ai ? ` · Round ${state.round} of 3` : '';
      if (ai) {
        match.textContent = `YOU ${state.playerRoundWins} — ${state.aiRoundWins} HOUSE`;
        const usable = !state.over && !state.matchOver && !state.busy && !state.aiTurn && state.spun;
        chips(youKit, state.playerItems, usable);
        chips(houseKit, state.aiItems, false);
        if (!state.over && !state.aiTurn) {
          turn.textContent = state.spun ? 'YOUR TURN' : 'LOAD THE REVOLVER';
          turn.classList.remove('ai');
        } else if (!state.over) {
          turn.textContent = "HOUSE'S TURN";
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
      const done = state.over || state.matchOver;
      spinBtn.disabled = !playable || state.spun;
      fireBtn.disabled = !playable || !state.spun;
      spinBtn.classList.toggle('hidden', done || state.spun);
      fireBtn.classList.toggle('hidden', done || !state.spun);
      const cash = canCashOut(state) && playable;
      cashBtn.classList.toggle('hidden', !cash);
      cashBtn.textContent = `CASH OUT ${money(state.pot)}`;
      nextBtn.classList.toggle('hidden', !(state.over && ai && !state.matchOver));
      againBtn.classList.toggle('hidden', !(state.over && (!ai || state.matchOver)));

      hint.textContent = !playable
        ? ''
        : state.spun ? 'or press and hold the table to pull' : 'or swipe the table to spin';
    },
  };
}
