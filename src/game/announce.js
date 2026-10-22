import { CHAMBERS, STAKE, oddsDenom } from './logic.js';

/**
 * One spoken sentence for the 3D table (canvas is aria-hidden).
 * Covers turn, chamber count, odds, pot / score, and the last result.
 */

function sayHouse(text, opponent) {
  return String(text || '').replace(/\bHOUSE\b/g, opponent);
}

function chambersLeft(state) {
  const spent = state.mode === 'fair' || !state.spun ? 0 : state.pulls;
  return Math.max(0, CHAMBERS - spent);
}

function potLine(state, opponent) {
  if (state.mode === 'ai') {
    return `Score you ${state.playerRoundWins}, ${opponent} ${state.aiRoundWins}.`;
  }
  if (state.winner === 'cash') return `Banked $${state.cashed}.`;
  if (state.over) return `Take-home $0.`;
  if (state.survived) return `Pot $${state.pot}.`;
  return `Stake $${STAKE}.`;
}

function turnLine(state, opponent) {
  if (state.matchOver) return 'Match over.';
  if (state.over) return state.mode === 'ai' ? 'Round over.' : 'Run over.';
  if (state.mode === 'ai') {
    if (state.aiTurn) return `${opponent} has the revolver.`;
    return state.spun ? 'Your turn.' : 'Load the revolver.';
  }
  return state.spun ? 'Your move.' : 'Spin the cylinder.';
}

function oddsLine(state) {
  if (state.over || state.matchOver) return '';
  if (!state.spun) return 'Cylinder not loaded.';
  const denom = oddsDenom(state);
  return denom <= 1 ? 'The next chamber is live.' : `1 in ${denom} is live.`;
}

export function tableLiveText(state, opponent = 'HOUSE') {
  if (!state) return 'No table.';
  const name = opponent || 'HOUSE';
  const parts = [
    turnLine(state, name),
    `${chambersLeft(state)} of ${CHAMBERS} chambers left.`,
  ];
  const odds = oddsLine(state);
  if (odds) parts.push(odds);
  parts.push(potLine(state, name));
  if (state.status) parts.push(sayHouse(state.status, name));
  return parts.join(' ');
}
