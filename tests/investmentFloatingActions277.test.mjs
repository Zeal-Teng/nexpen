import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('src/InvestmentProducts.jsx','utf8');
const css=readFileSync('src/folio-redesign.css','utf8');
test('all three investment editor forms share submit ID and floating save button without cancel',()=>{
 assert.equal((src.match(/<form id="investment-product-edit-form"/g)||[]).length,3);
 assert.match(src,/type="submit" form="investment-product-edit-form" className="fab investment-product-action-fab investment-product-action-save"/);
 assert.doesNotMatch(src,/investment-product-action-cancel/);
 assert.match(src,/className="circle-button" onClick=\{close\} aria-label="關閉"/);
 assert.doesNotMatch(src,/<footer>[\s\S]{0,260}取消/);
});
test('edit-only delete actions remain separate and floating, with scroll clearance',()=>{
 assert.match(src,/dialog==='valuation'&&valuationEditing&&<button/);
 assert.match(src,/dialog==='flow'&&editing&&<button/);
 assert.match(css,/investment-product-floating-actions/);
 assert.match(css,/padding-bottom: calc\(214px/);
 assert.match(css,/pointer-events: none/);
});
