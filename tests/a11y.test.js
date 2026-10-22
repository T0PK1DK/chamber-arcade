import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hud = readFileSync(join(root, 'src/ui/hud.js'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'src/style.css'), 'utf8');
const main = readFileSync(join(root, 'src/main.js'), 'utf8');

test('skip link is the first tab stop and points at menu or table', () => {
  assert.match(html, /<a class="skip" id="skipLink" href="#menu">Skip to menu<\/a>/);
  assert.match(html, /<canvas id="stage" aria-hidden="true">/);
  assert.match(hud, /setSkip\('#hud', 'Skip to table'\)/);
  assert.match(hud, /Skip to age check/);
  assert.match(css, /\.skip\s*\{/);
  assert.match(css, /\.sr-only\s*\{/);
});

test('HUD keeps a single live region for 3D table state', () => {
  assert.match(hud, /id="tableLive"/);
  assert.match(hud, /tableLiveText\(state, opponent\)/);
  assert.match(hud, /from '\.\.\/game\/announce\.js'/);
  assert.match(hud, /aria-live="polite"/);
  assert.match(hud, /status[\s\S]*aria-hidden="true"/);
  assert.match(hud, /aria-label.*Odds/);
  assert.match(hud, /aria-label.*\$\{potLabel/);
});

test('toggles and actions keep accessible names and pressed state', () => {
  assert.match(hud, /Blood effects on/);
  assert.match(hud, /Sound off/);
  assert.match(hud, /aria-keyshortcuts="C"/);
  assert.match(hud, /Back to menu/);
  assert.match(hud, /houseKitLabel/);
});

test('the 18\+ gate and canvas stay in place', () => {
  assert.match(hud, /id="gate"/);
  assert.match(hud, /I'M 18 OR OLDER/);
  assert.match(html, /aria-hidden="true"/);
  assert.equal(main.includes('from \'./scene/world.js\''), false);
});
