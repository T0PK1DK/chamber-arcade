import { CHAMBERS, ITEMS, STAKE, canCashOut, canPass, oddsDenom } from '../game/logic.js';
import { tableLiveText } from '../game/announce.js';
import {
  loadScores,
  loadAdultOk,
  saveAdultOk,
  loadBigText,
  saveBigText,
  loadGore,
  saveGore,
  loadFinish,
  saveFinish,
} from '../game/storage.js';
import { makeSplatter, paintSplatter, FINISHES } from '../game/splatter.js';

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

export function createHud({ onStart, onSpin, onPull, onShoot, onPass, onItem, onCash, onAgain, onNext, onMenu, onMute, onFinish }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="top">
      <div class="brand">
        <strong>CHAMBER</strong>
        <span>Russian Roulette</span>
      </div>
      <div class="top-btns">
        <button type="button" id="textBtn" class="ghost" aria-pressed="false" aria-label="Larger text">A+</button>
        <button type="button" id="goreBtn" class="ghost" aria-pressed="true" aria-label="Blood effects on">BLOOD ON</button>
        <button type="button" id="muteBtn" class="ghost" aria-pressed="false" aria-label="Sound on">SOUND ON</button>
      </div>
    </header>

    <p id="bootLine" class="boot" hidden>Lighting the table…</p>

    <section id="gate" class="panel gate" aria-labelledby="gateTitle" tabindex="-1" hidden>
      <h1 id="gateTitle">18+</h1>
      <p class="lead">This is a game of Russian roulette with a revolver.</p>
      <p>It contains <strong>guns, blood and simulated violence</strong>. It's played with play money only. You can switch blood off any time with the <strong>BLOOD</strong> button.</p>
      <div class="gate-btns">
        <button type="button" id="gateYes" class="primary">I'M 18 OR OLDER</button>
        <a class="button ghost" href="https://www.google.com/" aria-label="Leave this site">LEAVE</a>
      </div>
      <p class="care">Having a hard time? In the US, call or text <strong>988</strong>, any hour. Elsewhere, contact your local crisis line.</p>
    </section>

    <section id="menu" class="panel menu" aria-label="Choose a game" tabindex="-1">
      <h1>CHAMBER</h1>
      <p class="sub">Six chambers · One round · Your nerve</p>
      <div class="modes">
        <button type="button" data-mode="classic" aria-keyshortcuts="2">ONE SPIN<span>Spin once, then keep pulling. Each empty chamber raises the odds and grows the pot faster. Walk away any time.</span></button>
        <button type="button" data-mode="fair" aria-keyshortcuts="1">SPIN EVERY PULL<span>The cylinder is spun before every pull. Always 1 in 6. Steady money.</span></button>
        <button type="button" data-mode="ai" aria-keyshortcuts="3">DUEL A STRANGER<span>Aim at yourself or at them. Survive your own shot and you keep the revolver. Best of three.</span></button>
      </div>
      <div class="finish" role="radiogroup" aria-label="Revolver finish">
        <small>YOUR REVOLVER</small>
        <div>
          <button type="button" data-finish="blued" role="radio">BLUED</button>
          <button type="button" data-finish="nickel" role="radio">NICKEL</button>
          <button type="button" data-finish="gold" role="radio">GOLD</button>
        </div>
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
          <li>In a <strong>Duel</strong> you choose where to aim. <strong>Shoot yourself</strong>: an empty chamber lets you keep the revolver, and the odds on the next one get worse for whoever faces it. <strong>Shoot them</strong>: an empty chamber hands them the revolver. Whoever takes the round loses it. Once per round you may <strong>pass</strong> it over without firing.</li>
          <li>Keys: <kbd>Space</kbd> spin / shoot yourself · <kbd>O</kbd> shoot opponent · <kbd>P</kbd> pass · <kbd>C</kbd> cash out · <kbd>Esc</kbd> menu · <kbd>M</kbd> sound.</li>
          <li>On a phone: swipe the table to spin, and press and hold it to pull.</li>
        </ul>
      </details>
    </section>

    <section id="hud" class="hud hidden" aria-label="Table" tabindex="-1">
      <p id="tableLive" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
      <div class="banner">
        <p id="turn" class="turn"></p>
        <p id="status" class="status" aria-hidden="true">READY</p>
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
        <div><small id="houseKitLabel">HOUSE</small><div id="houseKit" class="chips"></div></div>
      </div>
      <p id="hint" class="hint" aria-hidden="true"></p>
      <div class="actions" id="actions">
        <button type="button" id="menuBtn" class="ghost side" aria-label="Back to menu">MENU</button>
        <button type="button" id="cashBtn" class="cash hidden" aria-keyshortcuts="C">CASH OUT</button>
        <button type="button" id="shootBtn" class="shoot hidden" aria-keyshortcuts="O">SHOOT HOUSE</button>
        <button type="button" id="passBtn" class="ghost side hidden" aria-keyshortcuts="P">PASS</button>
        <button type="button" id="spinBtn" class="primary">SPIN</button>
        <button type="button" id="fireBtn" class="primary pull hidden" disabled>PULL THE TRIGGER</button>
        <button type="button" id="nextBtn" class="primary hidden">NEXT ROUND</button>
        <button type="button" id="againBtn" class="primary hidden">PLAY AGAIN</button>
      </div>
      <div id="endCard" class="end-card hidden" role="status" aria-live="polite">
        <p id="endTitle" class="end-title">MATCH OVER</p>
        <p id="endSub" class="end-sub"></p>
      </div>
    </section>

    <div id="holdRing" class="hold-ring" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27"/><circle class="fill" cx="32" cy="32" r="27" pathLength="100"/></svg><span>HOLD</span></div>

    <p class="disclaimer">18+ · GUNS, BLOOD &amp; VIOLENCE · PLAY MONEY · A GAME</p>
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
  const houseKitLabel = $('houseKitLabel');
  const tableLive = $('tableLive');
  const skipLink = document.getElementById('skipLink');
  const spinBtn = $('spinBtn');
  const fireBtn = $('fireBtn');
  const cashBtn = $('cashBtn');
  const shootBtn = $('shootBtn');
  const passBtn = $('passBtn');
  let opponent = 'HOUSE';
  const nextBtn = $('nextBtn');
  const againBtn = $('againBtn');
  const endCard = $('endCard');
  const endTitle = $('endTitle');
  const endSub = $('endSub');
  const muteBtn = $('muteBtn');
  const textBtn = $('textBtn');
  const hint = $('hint');
  const holdRing = $('holdRing');
  const holdFill = holdRing.querySelector('.fill');
  const flashEl = document.getElementById('flash');
  const blackEl = document.getElementById('blackout');
  const splatEl = document.getElementById('splat');
  const goreBtn = $('goreBtn');
  let gore = loadGore();
  function setGore(on) {
    gore = on;
    goreBtn.textContent = on ? 'BLOOD ON' : 'BLOOD OFF';
    goreBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    goreBtn.setAttribute('aria-label', on ? 'Blood effects on' : 'Blood effects off');
    if (!on && splatEl) splatEl.className = '';
  }
  setGore(gore);
  goreBtn.addEventListener('click', () => {
    saveGore(!gore);
    setGore(!gore);
  });

  let finish = loadFinish();
  const finishBtns = [...document.querySelectorAll('[data-finish]')];
  function setFinish(name) {
    finish = FINISHES.includes(name) ? name : 'blued';
    finishBtns.forEach((b) => {
      const on = b.dataset.finish === finish;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    if (onFinish) onFinish(finish);
  }
  finishBtns.forEach((b) => b.addEventListener('click', () => {
    saveFinish(b.dataset.finish);
    setFinish(b.dataset.finish);
  }));

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
  function setSkip(target, label) {
    if (!skipLink) return;
    skipLink.setAttribute('href', target);
    skipLink.textContent = label;
  }

  function applyGate() {
    gate.hidden = adult;
    menu.classList.toggle('active', adult && hud.classList.contains('hidden'));
    if (hud.classList.contains('hidden')) {
      setSkip(adult ? '#menu' : '#gate', adult ? 'Skip to menu' : 'Skip to age check');
    }
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
  shootBtn.addEventListener('click', onShoot);
  passBtn.addEventListener('click', onPass);
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
    get gore() {
      return gore;
    },
    get finish() {
      return finish;
    },
    applyFinish() {
      setFinish(finish);
    },
    /** Blood across the screen when you take the round (blood on only). */
    splat() {
      if (!gore || !splatEl) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      splatEl.width = Math.round(w * dpr);
      splatEl.height = Math.round(h * dpr);
      const g = splatEl.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      // Thrown from the right temple across the view, plus a second smaller hit.
      paintSplatter(g, w, h, makeSplatter(Math.random, {
        cx: 0.92, cy: 0.4, angle: Math.PI, spread: 1.8, reach: 0.95, blobs: 7, drops: 120, drips: 6,
      }), 'rgba(120,6,6,0.92)', 'rgba(50,2,2,0.95)');
      paintSplatter(g, w, h, makeSplatter(Math.random, {
        cx: 0.62, cy: 0.18, angle: 2.4, spread: 2.4, reach: 0.35, blobs: 3, drops: 40, drips: 3,
      }), 'rgba(120,6,6,0.88)', 'rgba(50,2,2,0.9)');
      splatEl.className = '';
      void splatEl.offsetWidth;
      splatEl.className = 'on';
    },
    setOpponent(title) {
      opponent = title || 'HOUSE';
      if (houseKitLabel) houseKitLabel.textContent = opponent.replace(/^THE /, '');
    },
    clearSplat() {
      if (splatEl) splatEl.className = '';
    },
    setMuted(muted) {
      muteBtn.textContent = `SOUND ${muted ? 'OFF' : 'ON'}`;
      muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
      muteBtn.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on');
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
      hud.removeAttribute('aria-busy');
      applyGate();
      paintScores();
      if (adult) menu.querySelector('[data-mode]')?.focus({ preventScroll: true });
    },
    showGame() {
      menu.classList.remove('active');
      hud.classList.remove('hidden');
      setSkip('#hud', 'Skip to table');
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
    /** Cut to black when you take the round (after `delay`), fade back after `ms`. */
    blackout(ms, delay = 0) {
      if (!blackEl) return;
      const go = () => {
        blackEl.className = 'on';
        setTimeout(() => { blackEl.className = 'fade'; }, ms);
      };
      if (delay) setTimeout(go, delay);
      else go();
    },
    /** Tunnel vision while the revolver is at your temple. */
    setAim(on) {
      document.body.classList.toggle('aim', Boolean(on));
    },
    clearBlackout() {
      if (blackEl) blackEl.className = '';
    },
    render(state) {
      // Rules text says HOUSE; the table shows who is actually sitting there.
      const said = state.mode === 'ai' ? state.status.replace(/\bHOUSE\b/g, opponent) : state.status;
      if (status.textContent !== said) {
        status.textContent = said;
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
      odds.textContent = state.over
        ? ''
        : denom <= 1 ? 'THE NEXT ONE IS LIVE' : `1 IN ${denom} IS LIVE`;
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

      kits.classList.toggle('hidden', !ai || !(state.playerItems.length || state.aiItems.length));
      match.classList.toggle('hidden', !ai);
      round.textContent = ai ? ` · Round ${state.round} of 3` : '';
      if (ai) {
        match.textContent = `YOU ${state.playerRoundWins} — ${state.aiRoundWins} ${opponent}`;
        const usable = !state.over && !state.matchOver && !state.busy && !state.aiTurn && state.spun;
        chips(youKit, state.playerItems, usable);
        chips(houseKit, state.aiItems, false);
        if (!state.over && !state.aiTurn) {
          turn.textContent = state.spun ? 'YOUR TURN' : 'LOAD THE REVOLVER';
          turn.classList.remove('ai');
        } else if (!state.over) {
          turn.textContent = `${opponent} HAS THE REVOLVER`;
          turn.classList.add('ai');
        } else {
          turn.textContent = state.matchOver ? 'MATCH OVER' : 'ROUND OVER';
          turn.classList.remove('ai');
        }
      } else {
        turn.textContent = state.over ? (state.winner === 'cash' ? 'CASHED OUT' : 'RUN OVER') : (state.spun ? 'YOUR MOVE' : 'SPIN TO LOAD');
        turn.classList.remove('ai');
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
      fireBtn.textContent = ai ? 'SHOOT YOURSELF' : 'PULL THE TRIGGER';
      shootBtn.classList.toggle('hidden', !(ai && playable && state.spun));
      shootBtn.textContent = `SHOOT ${opponent.replace(/^THE /, '')}`;
      const passable = ai && playable && canPass(state, 'player');
      passBtn.classList.toggle('hidden', !passable);
      nextBtn.classList.toggle('hidden', !(state.over && ai && !state.matchOver));
      againBtn.classList.toggle('hidden', !(state.over && (!ai || state.matchOver)));
      if (state.matchOver && ai) againBtn.textContent = 'REMATCH';
      else if (state.winner === 'cash') againBtn.textContent = 'PLAY AGAIN';
      else againBtn.textContent = 'PLAY AGAIN';
      nextBtn.textContent = 'NEXT ROUND';

      // Clear win / lose / cash banner so a finished match is obvious on a phone.
      if (endCard) {
        const showEnd = Boolean(state.over && (!ai || state.matchOver || state.winner === 'cash'));
        const showRound = Boolean(ai && state.over && !state.matchOver);
        endCard.classList.toggle('hidden', !(showEnd || showRound));
        endCard.classList.toggle('win', false);
        endCard.classList.toggle('lose', false);
        if (ai && state.matchOver) {
          const youWon = state.playerRoundWins > state.aiRoundWins;
          const split = state.playerRoundWins === state.aiRoundWins;
          endTitle.textContent = split ? 'MATCH SPLIT' : (youWon ? 'YOU WIN' : 'HOUSE WINS');
          endSub.textContent = `Final ${state.playerRoundWins}–${state.aiRoundWins} · tap REMATCH`;
          endCard.classList.toggle('win', youWon && !split);
          endCard.classList.toggle('lose', !youWon && !split);
        } else if (ai && state.over) {
          const youRound = state.winner === 'player';
          endTitle.textContent = youRound ? 'ROUND YOURS' : 'ROUND THEIRS';
          endSub.textContent = `${state.playerRoundWins}–${state.aiRoundWins} · tap NEXT ROUND`;
          endCard.classList.toggle('win', youRound);
          endCard.classList.toggle('lose', !youRound);
        } else if (state.winner === 'cash') {
          endTitle.textContent = 'CASHED OUT';
          endSub.textContent = `Banked $${state.cashed || state.pot || 0}`;
          endCard.classList.add('win');
        } else if (state.over) {
          endTitle.textContent = 'OUT';
          endSub.textContent = state.status || 'Tap PLAY AGAIN';
          endCard.classList.add('lose');
        }
      }

      hint.textContent = done
        ? (state.matchOver ? 'rematch or menu' : (ai ? 'next round when ready' : 'play again or menu'))
        : !playable
          ? ''
          : !state.spun ? 'or swipe the table to spin'
            : ai ? 'survive your own shot and you keep the revolver'
              : 'or press and hold the table to pull';

      hud.setAttribute('aria-busy', ai && state.aiTurn && !state.over ? 'true' : 'false');
      const spoken = tableLiveText(state, opponent);
      if (tableLive.textContent !== spoken) tableLive.textContent = spoken;
      turn.setAttribute('aria-label', turn.textContent || 'No turn');
      odds.setAttribute('aria-label', odds.textContent || 'Odds hidden');
      pot.setAttribute('aria-label', `${potLabel.textContent} ${pot.textContent}`);
    },
  };
}
