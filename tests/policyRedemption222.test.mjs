import test from 'node:test';
import assert from 'node:assert/strict';
import {policyRedemptionProjection} from '../src/policyRedemption.js';
import {investmentPosition} from '../src/investmentLedger.js';

test('policy redemption automatically subtracts value and releases proportionate cost',()=>{
 const account={id:'p',type:'policy',investmentCost:80000,policyValue:100000,policyRedemptionBaseValue:100000};
 const flow={id:'r',assetId:'p',kind:'redemption',date:'2026-10-01',createdAt:'2026-10-01',amount:20000};
 const projected=policyRedemptionProjection(account,[flow],[]);
 assert.equal(projected.valid,true);
 assert.equal(projected.snapshots[0].value,80000);
 assert.equal(projected.snapshots[0].costBasis,16000);
 const balance=investmentPosition(account,[{...flow,costBasis:projected.snapshots[0].costBasis}]);
 assert.equal(balance.cost,64000);
 assert.equal(balance.realized,4000);
});
test('multiple redemptions are replayed, not repeatedly subtracted from stale original value',()=>{
 const account={id:'p',type:'policy',investmentCost:100000,policyValue:100000,policyRedemptionBaseValue:100000};
 const fs=[{id:'a',assetId:'p',kind:'redemption',date:'2026-10-01',amount:30000},{id:'b',assetId:'p',kind:'redemption',date:'2026-10-02',amount:20000}];
 const result=policyRedemptionProjection(account,fs,[]);
 assert.equal(result.valid,true);
 assert.deepEqual(result.snapshots.map(x=>x.value),[70000,50000]);
 assert.equal(policyRedemptionProjection(account,[{...fs[0],amount:90000},fs[1]],[]).valid,false);
});
test('explicit later valuation becomes the new anchor for subsequent redemptions',()=>{
 const a={id:'p',investmentCost:100000,policyValue:90000,policyRedemptionBaseValue:100000};
 const fs=[{id:'a',assetId:'p',kind:'redemption',date:'2026-01-02',amount:20000},{id:'b',assetId:'p',kind:'redemption',date:'2026-02-02',amount:10000}];
 const valuations=[{id:'v',assetId:'p',date:'2026-02-01',value:95000}];
 assert.deepEqual(policyRedemptionProjection(a,fs,valuations).snapshots.map(x=>x.value),[80000,85000]);
});
