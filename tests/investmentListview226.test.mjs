import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL(`../src/${name}`,import.meta.url),'utf8');
test('detail ListView uses direction and text rather than badges',()=>{
 const jsx=read('InvestmentStack.jsx');
 const list=jsx.slice(jsx.indexOf('function ListViewPerformance'));
 assert.match(list, /TrendingUp/);
 assert.match(list, /TrendingDown/);
 assert.match(list, /investment-listview-performance/);
 assert.doesNotMatch(list, /investment-listview-badges/);
});
test('stock and generic detail rows put result after supporting information',()=>{
 const jsx=read('InvestmentStack.jsx');
 const stock=jsx.slice(jsx.indexOf('if(stockLayout)return'));
 assert.ok(stock.indexOf('investment-stock-row-details') < stock.indexOf('investment-stock-row-results'));
 const css=read('folio-redesign.css').slice(read('folio-redesign.css').lastIndexOf('/* v226:'));
 assert.match(css,/investment-stock-row-results \{[\s\S]*?grid-row:3!important/);
 assert.match(css,/investment-generic-row-results \{[\s\S]*?grid-row:2!important/);
 assert.match(css,/white-space:nowrap!important/);
});
