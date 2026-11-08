import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/InvestmentProducts.jsx',import.meta.url),'utf8');
const picker=readFileSync(new URL('../src/InvestmentSheetSelect.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/folio-redesign.css',import.meta.url),'utf8');
test('investment forms route all dropdowns to the bottom-sheet picker',()=>{
 assert.equal((src.match(/<select\b/g)||[]).length,0);
 assert.ok((src.match(/<InvestmentSheetSelect\b/g)||[]).length>=7);
 assert.match(picker,/picker-backdrop investment-select-backdrop/);
});
test('investment flow deletion is available in the editor rather than ledger rows',()=>{
 assert.doesNotMatch(src,/aria-label="刪除異動"/);
 assert.match(src,/editing&&<button type="button" className="investment-form-delete"/);
});
test('investment forms use underline appearance for inputs and select triggers',()=>{
 assert.match(css,/v271: investment editing controls/);
 assert.match(css,/border-bottom:1px solid var\(--theme-line/);
 assert.match(css,/investment-sheet-select/);
});
