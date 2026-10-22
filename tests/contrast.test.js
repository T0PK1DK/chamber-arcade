import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { contrastRatio, HUD_PAIRS, HUD_TOKENS } from '../src/game/contrast.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');

test('HUD text pairs meet WCAG AA, and body text meets AAA on ink', () => {
  for (const pair of HUD_PAIRS) {
    const ratio = contrastRatio(pair.fg, pair.bg);
    assert.ok(
      ratio + 1e-6 >= pair.min,
      `${pair.name}: ${ratio.toFixed(2)}:1 < ${pair.min}:1 (${pair.fg} on ${pair.bg})`,
    );
  }
});

test('style.css tokens stay in lockstep with the contrast table', () => {
  assert.match(css, new RegExp(`--ink:\\s*${HUD_TOKENS.ink}`));
  assert.match(css, new RegExp(`--cream:\\s*${HUD_TOKENS.cream}`));
  assert.match(css, new RegExp(`--dim:\\s*${HUD_TOKENS.dim}`));
  assert.match(css, new RegExp(`--ember-text:\\s*${HUD_TOKENS.emberText}`));
  assert.match(css, new RegExp(`--win:\\s*${HUD_TOKENS.win}`));
  assert.match(css, /\.turn\.ai\s*\{[^}]*var\(--ember-text\)/);
  assert.match(css, /\.actions \.shoot[\s\S]*#8c1c16/);
});

test('every clickable control has a focus ring', () => {
  assert.match(css, /button:focus-visible/);
  assert.match(css, /a:focus-visible/);
  assert.match(css, /summary:focus-visible/);
  assert.match(css, /\.chip\.use:focus-visible/);
  assert.match(css, /\.skip:focus/);
});
