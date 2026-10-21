/**
 * Pure chamber-arcade rules. No DOM, no Three. Safe to unit-test in Node.
 *
 * fair    — re-spin before every pull. Always 1/6. Score = your safe pulls.
 * classic — one spin, chamber advances, odds rise 1/6 → 1/1.
 * ai      — one spin, shared revolver, you and the HOUSE take turns.
 *           Chamber advances each pull. First hit loses the round.
 *           Best of 3. Each side gets one RE-SPIN per round (a real
 *           house rule: spin the cylinder again before your pull).
 *
 * Solo modes keep a pot: start at a $100 stake, every safe pull pays
 * fair odds, and you may CASH OUT any time after your first safe pull.
 * A hit loses the pot. Fair odds = no house edge, the only question is nerve.
 *
 * SCOPE / RACK / STUN stay in the rules (and their tests) for an arcade
 * variant but are no longer dealt.
 */

export const CHAMBERS = 6;
export const MODES = Object.freeze({ fair: 'fair', classic: 'classic', ai: 'ai' });
export const ITEMS = Object.freeze({ scope: 'scope', rack: 'rack', stun: 'stun', respin: 'respin' });
export const ITEM_LIST = Object.freeze([ITEMS.scope, ITEMS.rack, ITEMS.stun]);
export const STAKE = 100;

/** Pot after `safe` survived pulls, paid at fair odds for each pull. */
export function potAfter(mode, safe) {
  if (!safe || safe < 0) return 0;
  if (mode === 'classic') {
    // Survive pull k (1 in 6-k live) → ×(6-k)/(5-k). Telescopes to 6/(6-safe).
    if (safe >= CHAMBERS) return 0;
    return Math.round((STAKE * CHAMBERS) / (CHAMBERS - safe));
  }
  if (mode === 'fair') return Math.round(STAKE * (CHAMBERS / (CHAMBERS - 1)) ** safe);
  return 0;
}

export const defaultRng = () => Math.random();

/** Arcade-variant dealer (unused by the real game; kept for that variant). */
export function pickItems(count, rng) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push(ITEM_LIST[Math.floor(rng() * ITEM_LIST.length)]);
  }
  return out;
}

function dealItems(state) {
  state.playerItems = [ITEMS.respin];
  state.aiItems = [ITEMS.respin];
}

export function createMatch(mode, rng = defaultRng) {
  if (!MODES[mode]) throw new Error(`unknown mode: ${mode}`);
  const state = {
    mode,
    bullet: -1,
    current: 0,
    survived: 0,
    pulls: 0,
    spun: false,
    over: false,
    aiTurn: false,
    busy: false,
    winner: null,
    round: 1,
    maxRounds: mode === 'ai' ? 3 : 1,
    playerRoundWins: 0,
    aiRoundWins: 0,
    matchOver: false,
    playerItems: [],
    aiItems: [],
    peek: null,
    tell: false,
    stunOn: null,
    pot: 0,
    cashed: 0,
    status: mode === 'ai' ? 'SPIN TO LOAD — YOU PULL FIRST' : 'SPIN THE CYLINDER',
    last: null,
  };
  if (mode === 'ai') dealItems(state, rng);
  return state;
}

export function canCashOut(state) {
  return state.mode !== 'ai' && !state.over && !state.busy && state.survived > 0 && state.pot > 0;
}

/** Walk away with the pot. Ends the run as a win. */
export function cashOut(state) {
  if (!canCashOut(state)) return { ok: false, reason: 'locked' };
  state.over = true;
  state.winner = 'cash';
  state.cashed = state.pot;
  state.peek = null;
  state.status = `CASHED OUT $${state.pot}`;
  state.last = { type: 'cash', pot: state.pot };
  return { ok: true, pot: state.pot };
}

export function resetMatch(state, rng = defaultRng) {
  Object.assign(state, createMatch(state.mode, rng));
  return state;
}

export function oddsDenom(state) {
  if (!state.spun) return CHAMBERS;
  if (state.mode === 'fair') return CHAMBERS;
  return Math.max(1, CHAMBERS - state.pulls);
}

export function isPlayerTurn(state) {
  return !state.over && !state.matchOver && !state.busy && !(state.mode === 'ai' && state.aiTurn);
}

export function canSpin(state) {
  return isPlayerTurn(state) && !state.spun;
}

export function canPull(state, who = 'player') {
  if (state.over || state.matchOver || !state.spun) return false;
  if (who === 'ai') return state.mode === 'ai' && state.aiTurn;
  return isPlayerTurn(state);
}

export function canUseItem(state, who = 'player') {
  if (state.over || state.matchOver || !state.spun) return false;
  if (who === 'player') return isPlayerTurn(state);
  return state.mode === 'ai' && state.aiTurn;
}

export function spin(state, rng = defaultRng) {
  if (state.over || state.matchOver || state.spun) return { ok: false, reason: 'locked' };
  if (state.mode === 'ai' && state.aiTurn) return { ok: false, reason: 'ai-turn' };
  state.bullet = Math.floor(rng() * CHAMBERS);
  state.current = Math.floor(rng() * CHAMBERS);
  state.spun = true;
  state.pulls = 0;
  state.peek = null;
  state.tell = false;
  state.status = 'READY — PULL';
  state.last = { type: 'spin', current: state.current, bullet: state.bullet };
  return { ok: true };
}

function finishHit(state, byAi) {
  state.over = true;
  state.busy = false;
  state.peek = null;
  state.tell = false;
  state.last = { type: 'hit', byAi };
  if (state.mode === 'ai') {
    if (byAi) {
      state.winner = 'player';
      state.playerRoundWins += 1;
      state.status = 'HOUSE OUT — YOU TAKE THE ROUND';
    } else {
      state.winner = 'ai';
      state.aiRoundWins += 1;
      state.status = 'OUT — HOUSE TAKES THE ROUND';
    }
    const need = 2;
    if (state.playerRoundWins >= need || state.aiRoundWins >= need || state.round >= state.maxRounds) {
      state.matchOver = true;
      if (state.playerRoundWins > state.aiRoundWins) state.status = 'YOU WIN THE MATCH';
      else if (state.aiRoundWins > state.playerRoundWins) state.status = 'HOUSE WINS THE MATCH';
      else state.status = 'MATCH SPLIT';
    }
  } else {
    state.winner = 'bang';
    state.status = state.pot > 0 ? `OUT — LOST $${state.pot}` : 'OUT ON THE FIRST PULL';
    state.pot = 0;
  }
}

function passTurn(state, fromAi) {
  if (state.mode !== 'ai') return;
  if (!fromAi) {
    if (state.stunOn === 'ai') {
      state.stunOn = null;
      state.status = 'SAFE. HOUSE STUNNED — YOUR TURN';
      state.aiTurn = false;
      state.busy = false;
    } else {
      state.status = 'SAFE. HOUSE TURN';
      state.aiTurn = true;
      state.busy = true;
    }
    return;
  }
  if (state.stunOn === 'player') {
    state.stunOn = null;
    state.status = 'HOUSE SAFE. YOU ARE STUNNED — HOUSE AGAIN';
    state.aiTurn = true;
    state.busy = true;
  } else {
    state.status = 'HOUSE SAFE — YOUR TURN';
    state.aiTurn = false;
    state.busy = false;
  }
}

export function pull(state, who = 'auto') {
  const byAi = state.mode === 'ai' && state.aiTurn;
  if (who === 'player' && byAi) return { ok: false, reason: 'ai-turn' };
  if (who === 'ai' && !byAi) return { ok: false, reason: 'player-turn' };
  if (state.over || state.matchOver || !state.spun) return { ok: false, reason: 'locked' };
  if (!byAi && state.busy) return { ok: false, reason: 'busy' };

  const hit = state.current === state.bullet;
  state.pulls += 1;
  state.peek = null;
  state.tell = false;

  if (hit) {
    finishHit(state, byAi);
    return { ok: true, hit: true, byAi };
  }

  if (!byAi) state.survived += 1;
  if (state.mode !== 'ai') state.pot = potAfter(state.mode, state.survived);
  state.current = (state.current + 1) % CHAMBERS;
  state.last = { type: 'click', byAi, current: state.current };

  if (state.mode === 'fair') {
    state.spun = false;
    state.status = `SAFE — POT $${state.pot}`;
  } else if (state.mode === 'classic') {
    state.status = state.survived >= CHAMBERS - 1
      ? `SAFE — POT $${state.pot}. THE LAST ONE IS LIVE`
      : `SAFE — POT $${state.pot}`;
  } else {
    passTurn(state, byAi);
  }
  return { ok: true, hit: false, byAi };
}

export function useItem(state, item, who = 'player', rng = defaultRng) {
  if (!canUseItem(state, who)) return { ok: false, reason: 'locked' };
  const bag = who === 'player' ? state.playerItems : state.aiItems;
  const idx = bag.indexOf(item);
  if (idx < 0) return { ok: false, reason: 'missing' };
  bag.splice(idx, 1);

  if (item === ITEMS.scope) {
    state.peek = state.current === state.bullet ? 'live' : 'blank';
    if (who === 'ai') state.tell = state.peek === 'live';
    state.status = who === 'player'
      ? (state.peek === 'live' ? 'SCOPE: THIS CHAMBER IS LIVE' : 'SCOPE: THIS CHAMBER IS EMPTY')
      : 'HOUSE PEEKS THE CHAMBER';
    state.last = { type: 'scope', who, peek: state.peek };
    return { ok: true, item, peek: state.peek };
  }

  if (item === ITEMS.rack) {
    const wasLive = state.current === state.bullet;
    state.pulls += 1;
    state.current = (state.current + 1) % CHAMBERS;
    state.peek = null;
    state.tell = false;
    if (wasLive) {
      state.spun = false;
      state.bullet = -1;
      state.aiTurn = false;
      state.busy = false;
      state.status = who === 'player' ? 'RACKED THE LIVE. SPIN AGAIN' : 'HOUSE RACKED THE LIVE. SPIN AGAIN';
      state.last = { type: 'rack', who, ejected: 'live' };
      return { ok: true, item, ejected: 'live' };
    }
    state.status = who === 'player' ? 'RACKED AN EMPTY' : 'HOUSE RACKED AN EMPTY';
    state.last = { type: 'rack', who, ejected: 'blank', current: state.current };
    return { ok: true, item, ejected: 'blank' };
  }

  if (item === ITEMS.respin) {
    // Spin the cylinder again: the round lands somewhere new, odds back to 1 in 6.
    state.bullet = Math.floor(rng() * CHAMBERS);
    state.current = Math.floor(rng() * CHAMBERS);
    state.pulls = 0;
    state.peek = null;
    state.tell = false;
    state.status = who === 'player' ? 'YOU SPIN IT AGAIN — 1 IN 6' : 'HOUSE SPINS IT AGAIN';
    state.last = { type: 'respin', who };
    return { ok: true, item };
  }

  if (item === ITEMS.stun) {
    state.stunOn = who === 'player' ? 'ai' : 'player';
    state.status = who === 'player' ? 'HOUSE STUNNED NEXT TURN' : 'YOU ARE STUNNED NEXT TURN';
    state.last = { type: 'stun', who };
    return { ok: true, item };
  }

  return { ok: false, reason: 'unknown-item' };
}

export function nextRound(state, rng = defaultRng) {
  if (!state.over || state.matchOver || state.mode !== 'ai') return { ok: false };
  state.round += 1;
  state.bullet = -1;
  state.current = 0;
  state.survived = 0;
  state.pulls = 0;
  state.spun = false;
  state.over = false;
  state.aiTurn = false;
  state.busy = false;
  state.winner = null;
  state.peek = null;
  state.tell = false;
  state.stunOn = null;
  state.playerItems = [];
  state.aiItems = [];
  dealItems(state);
  state.status = `ROUND ${state.round} — SPIN TO LOAD`;
  state.last = { type: 'next-round', round: state.round };
  return { ok: true };
}

export function snapshot(state) {
  return {
    ...state,
    playerItems: state.playerItems.slice(),
    aiItems: state.aiItems.slice(),
    last: state.last ? { ...state.last } : null,
  };
}
