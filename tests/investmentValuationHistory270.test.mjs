import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {valuationRows,productWithValuations,productTwdRate} from '../src/investmentValuationsProduct.js';
const ui=readFileSync('src/InvestmentProducts.jsx','utf8');
const app=readFileSync('src/App.jsx','utf8');
const net=readFileSync('src/netWorth.js','utf8');
test('legacy single valuation remains visible without migration',()=>{
 const rows=valuationRows({priceDate:'2026-01-05',price:123.4,fxRate:31.2});
 assert.equal(rows.length,1);assert.equal(rows[0].id,'legacy');assert.equal(rows[0].price,123.4);
});
test('valuation history only changes asset current price according to latest date',()=>{
 const asset={id:'x',price:10,priceDate:'2026-01-01',currentFxRate:32,currentFxDate:'2026-11-07'};
 const updated=productWithValuations(asset,[{id:'a',date:'2026-03-01',price:101,fxRate:29},{id:'b',date:'2026-08-01',price:112,fxRate:30}]);
 assert.equal(updated.price,112);assert.equal(updated.fxRate,30);assert.equal(updated.currentFxRate,32);
 assert.deepEqual(updated.valuationHistory.map(x=>x.id),['b','a']);
});
test('portfolio FX always prioritizes latest rate over historical valuation rate',()=>{
 assert.equal(productTwdRate({currency:'USD',fxRate:30,currentFxRate:32}),32);
 assert.ok(Number.isNaN(productTwdRate({currency:'USD',fxRate:30}))); // historical reference is not a current quotation
 assert.equal(productTwdRate({currency:'TWD',fxRate:200}),1);
 assert.match(app,/productTwdRate\(p\)/);
 assert.match(net,/productTwdRate\(product\)/);
});
test('investment editors keep dated valuation input apart from basic metadata and cash flow',()=>{
 assert.match(ui,/dialog==='valuation'\?<form onSubmit=\{saveValuation\}>/);
 assert.match(ui,/valuationRows\(asset\)\.map/);
 assert.match(ui,/productWithValuations/);
 assert.match(ui,/參考匯率/);
});
