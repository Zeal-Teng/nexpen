import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const product=readFileSync('src/InvestmentProducts.jsx','utf8');
const app=readFileSync('src/App.jsx','utf8');
const css=readFileSync('src/folio-redesign.css','utf8');
test('product, valuation, and trade deletion use the shared themed confirmation dialog',()=>{
 assert.doesNotMatch(product,/window\.(?:confirm|alert|prompt)\s*\(/);
 assert.equal((product.match(/await askConfirm\(\{kind:'delete'/g)||[]).length,3);
 assert.match(app,/<InvestmentProducts askConfirm=\{askConfirm\}/);
 assert.match(app,/\{confirmationDialog\}/);
});
test('product deletion action is red and both sheet close buttons have contrast',()=>{
 assert.match(css,/investment-product-remove\.soft-btn\.small[^}]*background:#c72c49!important/s);
 assert.match(css,/sheet-head-actions > \.circle-button\.sheet-close-btn/);
 assert.match(css,/stroke-width:2\.6!important/);
 assert.match(product,/className="circle-button sheet-close-btn" onClick=\{close\}/);
});
