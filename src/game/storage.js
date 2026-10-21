const KEYS = {
  fair: 'chamberBest_fair',
  classic: 'chamberBest_classic',
  aiWins: 'chamberAiWins',
  aiLosses: 'chamberAiLosses',
  muted: 'chamberMuted',
  fairCash: 'chamberCash_fair',
  classicCash: 'chamberCash_classic',
  adult: 'chamberAdultOk',
  bigText: 'chamberBigText',
  legacy: 'chamberBest',
};

function rawGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function rawSet(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* private mode / quota */
  }
}

export function migrate() {
  const legacy = rawGet(KEYS.legacy);
  if (legacy && rawGet(KEYS.fair) === null) rawSet(KEYS.fair, legacy);
}

export function num(key) {
  return parseInt(rawGet(key) || '0', 10) || 0;
}

export function loadScores() {
  migrate();
  return {
    fair: num(KEYS.fair),
    classic: num(KEYS.classic),
    aiWins: num(KEYS.aiWins),
    aiLosses: num(KEYS.aiLosses),
    fairCash: num(KEYS.fairCash),
    classicCash: num(KEYS.classicCash),
  };
}

/** Best cash-out per solo mode. Returns true on a new record. */
export function saveBestCash(mode, pot) {
  if (mode !== 'fair' && mode !== 'classic') return false;
  const key = mode === 'fair' ? KEYS.fairCash : KEYS.classicCash;
  if (pot > num(key)) {
    rawSet(key, pot);
    return true;
  }
  return false;
}

export function loadAdultOk() {
  return rawGet(KEYS.adult) === '1';
}

export function saveAdultOk() {
  rawSet(KEYS.adult, '1');
}

export function loadBigText() {
  return rawGet(KEYS.bigText) === '1';
}

export function saveBigText(on) {
  rawSet(KEYS.bigText, on ? '1' : '0');
}

export function saveBest(mode, survived) {
  if (mode !== 'fair' && mode !== 'classic') return false;
  const key = mode === 'fair' ? KEYS.fair : KEYS.classic;
  if (survived > num(key)) {
    rawSet(key, survived);
    return true;
  }
  return false;
}

export function recordAiMatch(playerWon) {
  if (playerWon) rawSet(KEYS.aiWins, num(KEYS.aiWins) + 1);
  else rawSet(KEYS.aiLosses, num(KEYS.aiLosses) + 1);
}

export function loadMuted() {
  return rawGet(KEYS.muted) === '1';
}

export function saveMuted(muted) {
  rawSet(KEYS.muted, muted ? '1' : '0');
}
