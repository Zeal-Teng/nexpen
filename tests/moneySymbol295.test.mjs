import test from 'node:test';
import assert from 'node:assert/strict';
import {moneySymbol,formatMoneyDisplay} from '../src/moneyDisplay.js';
test('monetary output carries dollar sign and excludes primary currency code',()=>{
 assert.equal(formatMoneyDisplay(1500),'$1,500');
 assert.equal(formatMoneyDisplay(1500,{currency:'TWD',primaryCurrency:'TWD'}),'$1,500');
 assert.equal(formatMoneyDisplay(1500,{currency:'USD',primaryCurrency:'TWD'}),'USD $1,500');
 assert.equal(formatMoneyDisplay(-1200),'−$1,200');
 assert.equal(moneySymbol('+1,234'),'+$1,234');
 assert.equal(moneySymbol('−1,234'),'−$1,234');
 assert.equal(moneySymbol('—'),'—');
 assert.equal(moneySymbol('$1,234'),'$1,234');
});
test('all main financial views apply money display helper',async()=>{
 const fs=await import('node:fs');
 for(const file of ['App.jsx','IncomeExpenseReport.jsx','InvestmentProducts.jsx','InvestmentAssets.jsx','NetWorthGoal.jsx','NetWorthTrend.jsx','NetWorthBreakdown.jsx']){
  const source=fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
  assert.match(source,/moneySymbol|formatMoneyDisplay/,file);
 }
});
