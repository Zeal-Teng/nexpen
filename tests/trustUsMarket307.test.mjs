import test from 'node:test';
import assert from 'node:assert/strict';
import {trustMarket,trustQuoteKey,trustSymbolValid,trustValueTwd} from '../src/trustMarket.js';
import {collectClosingQuotes,mergeClosingQuotes} from '../src/manualMarketQuotes.js';
test('legacy trust and US trust remain distinct market keys',()=>{
 assert.equal(trustMarket({trustSymbol:'2330'}),'TW');
 assert.equal(trustQuoteKey({trustSymbol:'2330'}),'2330');
 assert.equal(trustQuoteKey({trustSymbol:'aapl',trustMarket:'US'}),'US:AAPL');
 assert.equal(trustSymbolValid('TW','AAPL'),false);
 assert.equal(trustSymbolValid('US','AAPL'),true);
 assert.equal(trustSymbolValid('US','BRK.B'),true);
 assert.equal(trustSymbolValid('US','2330'),false);
});
test('USD trust valuation converts only once to TWD',()=>{
 assert.equal(trustValueTwd({currency:'USD',fxRate:32},2.5,{price:200}),16000);
 assert.equal(trustValueTwd({currency:'TWD'},100,{price:120}),12000);
 assert.equal(trustValueTwd({currency:'USD',fxRate:0},2,{price:100}),null);
});
test('US quote fallback is keyed and retained',async()=>{
 const fetcher=async url=>({ok:true,json:async()=>url.includes('us-market-quotes.json')?{quotes:{'US:AAPL':{price:205,date:'2026-11-10'}}}:{format:'cyberpulse-market-quotes-v1',quotes:{}}});
 const codes=new Set(['US:AAPL']);
 const data=await collectClosingQuotes({codes,today:'2026-11-11',manual:false,bundleUrl:'/nexpen/market-quotes.json',fetcher});
 assert.equal(data.got['US:AAPL'].price,205);
 const result=mergeClosingQuotes({},data.got,data.origins,codes);
 assert.equal(result.merged['US:AAPL'].price,205);
});

test('US trust is USD in cost but TWD in net worth',async()=>{
 const {computeNetWorth}=await import('../src/netWorth.js');
 const result=computeNetWorth({accounts:[{id:'u',type:'trust',trustMarket:'US',currency:'USD',trustSymbol:'AAPL',trustShares:2,investmentCost:250,fxRate:32,includeInAssets:true}],quotes:{'US:AAPL':{price:200,date:'2026-11-10'}}});
 assert.equal(result.assets.find(x=>x.id==='trust').amount,12800);
 assert.equal(result.netWorth,12800);
});
