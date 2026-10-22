/**
 * The cast across the table. Looks only: no personal names (project rule),
 * just a table nickname. Each seat also carries an aggression / caution /
 * tell profile that the HOUSE brain reads. Pure data so it is Node-tested;
 * the scene builds the figure from these fields.
 */

export const HOUSE_PERSONA = Object.freeze({
  aggression: 0.5,
  caution: 0.5,
  tell: 0.5,
});

function persona(aggression, caution, tell) {
  return Object.freeze({ aggression, caution, tell });
}

export const CAST = Object.freeze([
  {
    id: 'banker',
    title: 'THE BANKER',
    skin: 0xc99a7a, hair: 0x2a2420, hairStyle: 'slick', facial: 'none',
    glasses: true, hat: 'none', suit: 0x23262d, shirt: 0xe8e2d4, tie: 0x5a1a1a,
    // Counts. Waits. Peeks. Rarely turns the gun until the math says so.
    persona: persona(0.22, 0.88, 0.80),
  },
  {
    id: 'captain',
    title: 'THE CAPTAIN',
    skin: 0xd6ad8c, hair: 0xc9c4ba, hairStyle: 'short', facial: 'mustache',
    glasses: false, hat: 'none', suit: 0x1f2a3a, shirt: 0xeae6dc, tie: 0x1a1a1a,
    // Steady. Close to the HOUSE table — slightly more self-tests.
    persona: persona(0.42, 0.58, 0.40),
  },
  {
    id: 'widow',
    title: 'THE WIDOW',
    skin: 0xe2bfa3, hair: 0x14100e, hairStyle: 'bob', facial: 'none',
    glasses: false, hat: 'none', suit: 0x141416, shirt: 0x2a1a1e, tie: 0x6a0f1a,
    // Aims across early. Almost never folds. Peeks so she can punish.
    persona: persona(0.85, 0.18, 0.70),
  },
  {
    id: 'gambler',
    title: 'THE GAMBLER',
    skin: 0x8a5a3c, hair: 0x14100c, hairStyle: 'short', facial: 'beard',
    glasses: false, hat: 'fedora', suit: 0x3a2a20, shirt: 0xd8cdb6, tie: 0x8a6a20,
    // Rides his own luck. No peek, no pass — gut only.
    persona: persona(0.35, 0.10, 0.12),
  },
  {
    id: 'stranger',
    title: 'THE STRANGER',
    skin: 0xb07a58, hair: 0x2a1a12, hairStyle: 'bald', facial: 'stubble',
    glasses: false, hat: 'fedora', suit: 0x24252b, shirt: 0xcfc6b2, tie: 0x15161a,
    // Unreadable. The HOUSE odds table, unmodified.
    persona: persona(0.5, 0.5, 0.5),
  },
  {
    id: 'professor',
    title: 'THE PROFESSOR',
    skin: 0xe6c2a6, hair: 0x8a8278, hairStyle: 'side', facial: 'beard',
    glasses: true, hat: 'none', suit: 0x4a4034, shirt: 0xe4dccb, tie: 0x2a3a2a,
    // Math. Peeks whenever it helps. Hands it over on long odds.
    persona: persona(0.28, 0.82, 0.92),
  },
]);

export function clamp01(n, fallback = 0.5) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.min(1, Math.max(0, x));
}

/** Fill missing fields with the HOUSE table (0.5 / 0.5 / 0.5). */
export function resolvePersona(p) {
  if (!p) return { ...HOUSE_PERSONA };
  return {
    aggression: clamp01(p.aggression),
    caution: clamp01(p.caution),
    tell: clamp01(p.tell),
  };
}

export function pickCharacter(rng = Math.random, notId = null) {
  const pool = CAST.filter((c) => c.id !== notId);
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

export function characterById(id) {
  return CAST.find((c) => c.id === id) || CAST[0];
}
