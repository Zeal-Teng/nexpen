import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeTrustPortfolio} from '../src/trustSummary.js';

const taiwan={id:'tw',type:'trust',currency:'TWD',trustMarket:'TW',trustSymbol:'2027',trustShares:100,investmentCost:4000};
const emptyUs={id:'us',type:'trust',currency:'USD',trustMarket:'US',trustSymbol:'AAPL',trustShares:0,investmentCost:0,fxRate:0};
test('empty US trust without quote or exchange rate does not blank Taiwan trust summary',()=>{
 const s=summarizeTrustPortfolio([emptyUs,taiwan],[],{'2027':{price:48.7}});
 assert.equal(s.value,4870);assert.equal(s.cost,4000);assert.equal(s.missingCount,0);assert.equal(s.complete,true);
});
test('valid US and Taiwan holdings aggregate market values and costs in TWD',()=>{
 const us={...emptyUs,trustShares:2.5,investmentCost:250,fxRate:32};
 const s=summarizeTrustPortfolio([taiwan,us],[],{'2027':{price:48.7},'US:AAPL':{price:200}});
 assert.equal(s.value,20870);
 assert.equal(s.cost,12000);
 assert.equal(s.missingCount,0);
});
test('positive US shares without quote do not silently show incomplete total',()=>{
 const us={...emptyUs,trustShares:2.5,investmentCost:250,fxRate:32};
 const s=summarizeTrustPortfolio([taiwan,us],[],{'2027':{price:48.7}});
 assert.equal(s.value,4870);
 assert.equal(s.pricedCost,4000);
 assert.equal(s.missingCount,1);
 assert.equal(s.complete,false);
});
test('zero shares after a full redemption do not require a quote',()=>{
 const us={...emptyUs,trustShares:5,investmentCost:500,fxRate:32};
 const flows=[{assetId:'us',kind:'redemption',date:'2026-11-10',shares:5,amount:600}];
 const s=summarizeTrustPortfolio([taiwan,us],flows,{'2027':{price:48.7}});
 assert.equal(s.value,4870);assert.equal(s.cost,4000);assert.equal(s.missingCount,0);assert.equal(s.complete,true);
});
