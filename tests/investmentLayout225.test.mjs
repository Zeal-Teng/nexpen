import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=n=>fs.readFileSync(new URL(`../src/${n}`,import.meta.url),'utf8');
test('first tier keeps amount and badges within the same row, with metadata below',()=>{
 const app=read('App.jsx');
 assert.match(app,/investment-reference-amount[\s\S]*?investment-reference-net[\s\S]*?investment-reference-badges/);
 assert.match(app,/investment-reference-meta/);
});
test('secondary cards and holding listviews place amount and performance beside each other',()=>{
 const stack=read('InvestmentStack.jsx');
 assert.match(stack,/investment-compact-summary/);
 assert.match(stack,/investment-stock-row-results/);
 const css=read('folio-redesign.css');
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) auto!important/);
 assert.match(css,/investment-stock-row-details \{/);
});
test('realized cards distinguish proceeds from realized profit',()=>{
 const stocks=read('StockPerformanceView.jsx');
 const assets=read('InvestmentAssets.jsx');
 assert.match(stocks,/amount=\{money\(totalSaleProceeds\)\} profit=\{result\(sumRealized\)\}/);
 assert.match(assets,/realizedProceedsTotal/);
});
