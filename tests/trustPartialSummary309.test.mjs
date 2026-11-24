import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeTrustPortfolio} from '../src/trustSummary.js';
const tw={id:'tw',type:'trust',trustMarket:'TW',currency:'TWD',trustSymbol:'2027',trustShares:5412,investmentCost:239400};
const us={id:'us',type:'trust',trustMarket:'US',currency:'USD',trustSymbol:'AAPL',trustShares:100,investmentCost:1000,fxRate:32};
test('US missing quote preserves Taiwan subtotal and excludes US cost from partial performance',()=>{
 const q={'2027':{price:48.7}};
 const s=summarizeTrustPortfolio([us,tw],[],q);
 assert.equal(s.value,5412*48.7);
 assert.equal(s.cost,239400+32000);
 assert.equal(s.pricedCost,239400);
 assert.equal(s.missingCount,1);
 assert.equal(s.pricedCount,1);
 assert.equal(s.complete,false);
});
test('US quote acquired aggregates Taiwan and US',()=>{
 const s=summarizeTrustPortfolio([us,tw],[],{'2027':{price:48.7},'US:AAPL':{price:200}});
 assert.equal(s.value,5412*48.7+100*200*32);
 assert.equal(s.pricedCost,s.cost);
 assert.equal(s.complete,true);
});
