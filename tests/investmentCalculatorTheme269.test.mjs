import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync('src/InvestmentProducts.jsx','utf8');
const css=readFileSync('src/folio-redesign.css','utf8');
test('fund bond insurance term deposit numeric fields use shared amount calculator',()=>{
 assert.match(ui,/import AmountCalculator/);
 for(const key of ['price','premiumYears','declaredRate','couponRate','shares','amount','fee'])assert.ok(ui.includes(`'${key}'`),key);
 for(const key of ['year','cumulativePremium','endValue','nextValue'])assert.match(ui,new RegExp(`projectionNumber\\(i,'${key}'`));
 assert.match(ui,/flowForm\.exchangeRate/);
 assert.equal((ui.match(/type="number"/g)||[]).length,0);
});
test('date-based history FX refresh and user manual override are supported',()=>{
 assert.match(ui,/fetchHistoricalInvestmentRate\(productForm\.currency,'TWD',productForm\.priceDate/);
 assert.match(ui,/fetchHistoricalInvestmentRate\(asset\.currency,account\.currency,flowForm\.date/);
 assert.match(ui,/fxManual\.current=true/);
 assert.match(ui,/exchangeRateDate:/);
});
test('investment sheet surfaces use theme variables instead of fixed light background',()=>{
 assert.match(css,/:root\[data-theme\] \.investment-product-backdrop \.investment-product-sheet/);
 assert.match(css,/background:var\(--theme-surface\)!important/);
 assert.match(css,/investment-numeric-trigger/);
});
