import assert from 'node:assert/strict';
import {initialTrustShares,contributionTrustShares,totalTrustShares,trustMarketValue} from '../src/trustShares.js';
import {computeNetWorth} from '../src/netWorth.js';
const legacy={id:'trust',name:'Legacy',type:'trust',trustSymbol:'2027',trustLots:48.099,currency:'TWD'};
const flowOld={assetId:'trust',kind:'contribution',units:0.1};
const current={...legacy,trustShares:48099};
const flowNew={assetId:'trust',kind:'contribution',shares:100};
assert.equal(initialTrustShares(legacy),48099);
assert.equal(initialTrustShares(current),48099);
assert.equal(contributionTrustShares(flowOld),100);
assert.equal(contributionTrustShares(flowNew),100);
assert.equal(totalTrustShares(legacy,[flowOld]),48199);
assert.equal(totalTrustShares(current,[flowNew]),48199);
assert.equal(trustMarketValue(legacy,[flowOld],47.75),48199*47.75);
for(const [a,flow] of [[legacy,flowOld],[current,flowNew]]){
 const result=computeNetWorth({accounts:[a],investmentFlows:[flow],quotes:{'2027':{price:47.75}}});
 assert.equal(result.netWorth,48199*47.75,'share-based net worth for both record formats');
}
assert.equal(totalTrustShares({...legacy,trustShares:0},[]),0,'zero shares overrides old lots');
console.log('Trust shares, legacy migration and valuation tests passed');
