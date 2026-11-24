import assert from 'node:assert/strict';
import {computeNetWorth} from '../src/netWorth.js';
const model=computeNetWorth({
 accounts:[
  {id:'cash',name:'現金',type:'cash',currency:'TWD',openingBalance:1000},
  {id:'bank',name:'銀行',type:'bank',currency:'TWD',openingBalance:5000},
  {id:'broker',name:'交割戶',type:'brokerage',currency:'TWD',openingBalance:20000},
  {id:'credit',name:'信用卡',type:'credit',currency:'TWD',openingBalance:-3000},
  {id:'trust',name:'信託',type:'trust',currency:'TWD',trustSymbol:'2330',trustLots:2},
  {id:'policy',name:'保險',type:'policy',currency:'USD',fxRate:30,policyValue:100},
  {id:'hidden',name:'排除帳戶',type:'bank',currency:'TWD',openingBalance:99999,includeInAssets:false}
 ],
 records:[],stocks:[{account:'broker',action:'buy',totalAmount:10000}],investmentFlows:[],
 quotes:{'2330':{price:100},'0050':{price:200}},includedHoldings:[{symbol:'0050',shares:10}]
});
const category=id=>model.assets.find(a=>a.id===id)?.amount||0;
assert.equal(category('cash'),1000);
assert.equal(category('deposit'),15000);
assert.equal(category('securities'),2000);
assert.equal(category('trust'),200000);
assert.equal(category('insurance'),3000);
assert.equal(model.totalLiabilities,3000);
assert.equal(model.totalAssets,221000);
assert.equal(model.netWorth,218000);
assert.ok(Math.abs(model.assets.reduce((s,a)=>s+a.percent,0)-100)<1e-7);
assert.equal(model.missingQuotes.length,0);
const missing=computeNetWorth({accounts:[],includedHoldings:[{symbol:'2027',shares:200}],quotes:{}});
assert.deepEqual(missing.missingQuotes,['2027']);
assert.equal(missing.totalAssets,0);
console.log('Net worth breakdown tests passed');
