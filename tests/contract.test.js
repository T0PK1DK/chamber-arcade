import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('game + HUD stay Three-free so the table can lazy-load', () => {
  const files = [
    'src/game/logic.js',
    'src/game/ai.js',
    'src/game/audio.js',
    'src/game/storage.js',
    'src/game/input.js',
    'src/game/math.js',
    'src/game/feel.js',
    'src/game/gesture.js',
    'src/game/splatter.js',
    'src/game/characters.js',
    'src/scene/framing.js',
    'src/ui/hud.js',
    'src/main.js',
  ];
  for (const file of files) {
    const src = readFileSync(join(root, file), 'utf8');
    assert.equal(src.includes('from \'three\''), false, file);
    assert.equal(src.includes('from "three"'), false, file);
  }
});

test('main defers the 3D world instead of importing it up front', () => {
  const src = readFileSync(join(root, 'src/main.js'), 'utf8');
  assert.match(src, /import\('\.\/scene\/world\.js'\)/);
  assert.equal(src.includes('from \'./scene/world.js\''), false);
});

test('vite keeps Three in its own chunk and does not modulepreload it', () => {
  const src = readFileSync(join(root, 'vite.config.js'), 'utf8');
  assert.match(src, /manualChunks/);
  assert.match(src, /three/);
  assert.match(src, /modulePreload/);
});

test('Pages cache headers ship as an add-on, not a deploy', () => {
  assert.equal(existsSync(join(root, 'public/_headers')), true);
  const headers = readFileSync(join(root, 'public/_headers'), 'utf8');
  assert.match(headers, /max-age=31536000/);
});
