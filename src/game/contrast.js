/**
 * WCAG relative-luminance / contrast helpers. Used to lock HUD text
 * pairs (cream, dim, ember, pot gold) above AA — and preferably AAA.
 */

function channel(n) {
  const c = n / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function hexRgb(hex) {
  const h = String(hex).replace('#', '');
  if (h.length !== 6) throw new Error(`bad hex: ${hex}`);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function relativeLuminance(hex) {
  const [r, g, b] = hexRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg, bg) {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Tokens mirrored from src/style.css — keep in sync. */
export const HUD_TOKENS = Object.freeze({
  ink: '#0b0807',
  cream: '#f1e8d4',
  dim: '#c9bda6',
  brass: '#d8b25a',
  emberText: '#ffc090',
  bang: '#ff6a52',
  win: '#e9cf7a',
  cashInk: '#1a1208',
  shootFg: '#fff4ee',
  shootBg: '#8c1c16',
  lampFelt: '#4a3a20',
});

export const HUD_PAIRS = Object.freeze([
  { name: 'cream on ink', fg: HUD_TOKENS.cream, bg: HUD_TOKENS.ink, min: 7 },
  { name: 'dim on ink', fg: HUD_TOKENS.dim, bg: HUD_TOKENS.ink, min: 7 },
  { name: 'brass on ink', fg: HUD_TOKENS.brass, bg: HUD_TOKENS.ink, min: 4.5 },
  { name: 'ember text on ink (turn.ai)', fg: HUD_TOKENS.emberText, bg: HUD_TOKENS.ink, min: 7 },
  { name: 'bang on ink', fg: HUD_TOKENS.bang, bg: HUD_TOKENS.ink, min: 4.5 },
  { name: 'win / pot gold on ink', fg: HUD_TOKENS.win, bg: HUD_TOKENS.ink, min: 7 },
  { name: 'cash label on gold', fg: HUD_TOKENS.cashInk, bg: HUD_TOKENS.win, min: 7 },
  { name: 'shoot label on crimson', fg: HUD_TOKENS.shootFg, bg: HUD_TOKENS.shootBg, min: 4.5 },
  { name: 'ember text on lamp felt', fg: HUD_TOKENS.emberText, bg: HUD_TOKENS.lampFelt, min: 4.5 },
  { name: 'dim on lamp felt', fg: HUD_TOKENS.dim, bg: HUD_TOKENS.lampFelt, min: 4.5 },
]);
