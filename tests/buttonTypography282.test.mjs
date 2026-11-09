import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/button-typography.css', import.meta.url), 'utf8');
const entry = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');

test('global typography sheet is imported after existing styles', () => {
  assert.match(entry, /import '\.\/demo-mode\.css';[\s\S]*import '\.\/button-typography\.css';/);
});
test('one 14px button label token covers portal sheets and dialog controls', () => {
  assert.match(css, /--nexpen-button-label-size:\s*14px;/);
  for(const name of ['.app-shell','.investment-product-backdrop','.picker-sheet','.nexpen-confirm-dialog','button.soft-btn','button.primary-btn','button.danger-btn','button.picker-option']) assert.ok(css.includes(name), name);
});
test('numeric keypad, calendar dates and icon controls retain their special scales', () => {
  for(const name of ['.calc-key','.week-day','.circle-button','.fab','.sheet-close-button','.pin-key']) assert.ok(css.includes(name), name);
  assert.match(css, /\.bottom-nav button\s*\{\s*font-size:\s*11px/);
});

test('investment product detail action buttons override old specific 12px mobile selector', () => {
  assert.match(css, /html body \.app-shell \.investment-product-page \.savings-detail-history \.savings-action-grid > button\.soft-btn\.small\s*\{[\s\S]*?font-size:\s*var\(--nexpen-button-label-size\)\s*!important/);
  const old = readFileSync(new URL('../src/folio-redesign.css', import.meta.url), 'utf8');
  assert.match(old, /savings-action-grid > button\.soft-btn\.small\s*\{\s*font-size:12px!important;/);
  assert.match(entry, /import '\.\/folio-redesign\.css';[\s\S]*import '\.\/button-typography\.css';/);
});
