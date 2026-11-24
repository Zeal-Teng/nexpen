import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const jsx=readFileSync(new URL('../src/InvestmentProducts.jsx', import.meta.url),'utf8');
const css=readFileSync(new URL('../src/folio-redesign.css', import.meta.url),'utf8');
test('all investment product and flow date fields share the safe date control',()=>{
  assert.match(jsx,/import NativeDatePicker from '\.\/NativeDatePicker\.jsx'/);
  assert.equal((jsx.match(/<NativeDatePicker\b/g)||[]).length,5);
  assert.doesNotMatch(jsx, /<input\s+(?:required\s+)?type="date"/);
});
test('portal date field overlays cannot overflow their mobile label',()=>{
  assert.match(css,/\.investment-product-sheet \.native-date-control > input\.native-date-input/);
  assert.match(css,/\.investment-product-sheet > form > label/);
  assert.match(css,/\.investment-product-sheet \.native-date-display/);
});
