import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const jsx=readFileSync(new URL('../src/InvestmentProducts.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/folio-redesign.css',import.meta.url),'utf8');
test('savings action grid overrides global small button left margin and clamps width',()=>{
  const rules=css.slice(css.indexOf('/* v263:'));
  assert.match(rules,/savings-action-grid > button\.soft-btn\.small\s*\{[\s\S]*?width:100%!important;[\s\S]*?margin:0!important;/);
  assert.match(rules,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important;/);
});
test('savings contribution history shows date without repeated principal amount',()=>{
  assert.match(jsx,/f\.date\}\{f\.kind==='redemption'&&!f\.feeRow\?/);
  assert.doesNotMatch(jsx,/f\.date\}\{f\.kind!=='yield'&&!f\.feeRow\?` · 本金/);
});
