/**
 * The cast across the table. Looks only: no personal names (project rule),
 * just a table nickname. Pure data so it is Node-tested; the scene builds
 * the figure from these fields.
 */

export const CAST = Object.freeze([
  {
    id: 'banker',
    title: 'THE BANKER',
    skin: 0xc99a7a, hair: 0x2a2420, hairStyle: 'slick', facial: 'none',
    glasses: true, hat: 'none', suit: 0x23262d, shirt: 0xe8e2d4, tie: 0x5a1a1a,
  },
  {
    id: 'captain',
    title: 'THE CAPTAIN',
    skin: 0xd6ad8c, hair: 0xc9c4ba, hairStyle: 'short', facial: 'mustache',
    glasses: false, hat: 'none', suit: 0x1f2a3a, shirt: 0xeae6dc, tie: 0x1a1a1a,
  },
  {
    id: 'widow',
    title: 'THE WIDOW',
    skin: 0xe2bfa3, hair: 0x14100e, hairStyle: 'bob', facial: 'none',
    glasses: false, hat: 'none', suit: 0x141416, shirt: 0x2a1a1e, tie: 0x6a0f1a,
  },
  {
    id: 'gambler',
    title: 'THE GAMBLER',
    skin: 0x8a5a3c, hair: 0x14100c, hairStyle: 'short', facial: 'beard',
    glasses: false, hat: 'fedora', suit: 0x3a2a20, shirt: 0xd8cdb6, tie: 0x8a6a20,
  },
  {
    id: 'stranger',
    title: 'THE STRANGER',
    skin: 0xb07a58, hair: 0x2a1a12, hairStyle: 'bald', facial: 'stubble',
    glasses: false, hat: 'fedora', suit: 0x24252b, shirt: 0xcfc6b2, tie: 0x15161a,
  },
  {
    id: 'professor',
    title: 'THE PROFESSOR',
    skin: 0xe6c2a6, hair: 0x8a8278, hairStyle: 'side', facial: 'beard',
    glasses: true, hat: 'none', suit: 0x4a4034, shirt: 0xe4dccb, tie: 0x2a3a2a,
  },
]);

export function pickCharacter(rng = Math.random, notId = null) {
  const pool = CAST.filter((c) => c.id !== notId);
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

export function characterById(id) {
  return CAST.find((c) => c.id === id) || CAST[0];
}
