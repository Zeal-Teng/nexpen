import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {investmentProductPosition,investmentProductValue,productCashRate,validateProductTrade} from '../src/investmentProducts.js';
import {investmentCashMovement} from '../src/investmentCashFlow.js';
import {investmentDiaryRows} from '../src/investmentDiary.js';
const fund={id:'fund-1',type:'fund',name:'美國股票基金',currency:'USD',price:13,fxRate:31.5};
const bond={id:'bond-1',type:'bond',name:'公司債',currency:'USD',price:97.5,fxRate:31.5};
const buy={id:'a',assetId:fund.id,kind:'contribution',date:'2026-01-01',amount:1000,shares:100,sourceAccount:'cash-usd'};
const sell={id:'b',assetId:fund.id,kind:'redemption',date:'2026-05-01',amount:650,shares:50,sourceAccount:'cash-twd',redemptionExchangeRate:32,redemptionFee:40};
test('fund weighted-average cost and redemption realized gains',()=>{
 const pos=investmentProductPosition(fund,[buy,sell]);
 assert.equal(pos.units,50);assert.equal(pos.cost,500);assert.equal(pos.realized,150);
 assert.equal(investmentProductValue(fund,pos),650);
 assert.equal(investmentCashMovement(buy),-1000);
 assert.equal(investmentCashMovement(sell),20760);
});
test('bond market value is price per 100 face',()=>{
 const pos=investmentProductPosition(bond,[{...buy,assetId:bond.id,shares:10000,amount:9900}]);
 assert.equal(investmentProductValue(bond,pos),9750);
});
test('redemption cannot exceed holdings, denomination on contribution enforced',()=>{
 assert.throws(()=>validateProductTrade(fund,[buy],{...sell,shares:200}, {currency:'TWD'}),/贖回數量/);
 assert.throws(()=>validateProductTrade(fund,[],buy,{currency:'TWD'}),/相同幣別/);
 assert.equal(productCashRate(fund,{currency:'TWD',fxRate:1}),31.5);
});
test('cash coupon and dividend posted separately without reducing units',()=>{
 const coupon={id:'c',assetId:bond.id,kind:'yield',date:'2026-05-01',amount:50,shares:0,sourceAccount:'cash-twd',redemptionExchangeRate:31.5,redemptionFee:5};
 assert.equal(investmentCashMovement(coupon),1570);
 assert.equal(investmentProductPosition(bond,[{...buy,assetId:bond.id,shares:10000,amount:10000},coupon]).units,10000);
 const rows=investmentDiaryRows([coupon],[{id:'cash-twd',currency:'TWD',name:'台幣銀行'}],[bond]);
 assert.equal(rows.length,2);assert.equal(rows[0].type,'income');assert.equal(rows[0].amount,1575);assert.equal(rows[1].amount,5);
});
test('fund/bond independent IndexedDB store included in backups and net worth',()=>{
 const db=readFileSync(new URL('../src/db.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
 const worth=readFileSync(new URL('../src/netWorth.js',import.meta.url),'utf8');
 assert.match(db,/db\.version\(10\)\.stores\(\{investmentProducts:/);
 assert.match(db,/investmentProducts\.bulkPut/);
 assert.match(app,/db\.investmentProducts\.toArray\(\)/);
 assert.match(worth,/investmentProductValue\(product,position\)/);
 assert.match(app,/\['fund','bond','savings','termDeposit'\]\.includes\(investSection\)/);
});
