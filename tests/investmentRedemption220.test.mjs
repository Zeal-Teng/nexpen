import test from 'node:test';
import assert from 'node:assert/strict';
import {investmentPosition,redemptionCostAt} from '../src/investmentLedger.js';
import {trustMarketValue} from '../src/trustShares.js';

test('trust redemption reduces shares and weighted-average cost, not by proceeds',()=>{
 const account={id:'t',type:'trust',trustShares:100,investmentCost:10000};
 const fs=[{id:'x',assetId:'t',kind:'redemption',date:'2026-01-02',shares:40,amount:6000,sourceAccount:'bank'}];
 assert.deepEqual(investmentPosition(account,fs),{cost:6000,shares:60,realized:2000,valid:true});
 assert.equal(trustMarketValue(account,fs,120),7200);
 assert.equal(redemptionCostAt(account,[],fs[0]).costBasis,4000);
});
test('policy redemption reduces acquisition cost by costBasis and credits proceeds',()=>{
 const account={id:'p',type:'policy',investmentCost:100000};
 const fs=[{id:'r',assetId:'p',kind:'redemption',date:'2026-02-01',amount:30000,costBasis:25000,sourceAccount:'bank'}];
 const pos=investmentPosition(account,fs);
 assert.equal(pos.cost,75000);assert.equal(pos.realized,5000);assert.equal(pos.valid,true);
 assert.equal(investmentPosition(account,[{...fs[0],costBasis:110000}]).valid,false);
});
test('redemption cannot create negative remaining share balance even if later contribution restores it',()=>{
 const a={id:'t',type:'trust',trustShares:50,investmentCost:5000};
 const fs=[{id:'r',assetId:'t',kind:'redemption',date:'2026-01-01',shares:80,amount:8000},{id:'c',assetId:'t',kind:'contribution',date:'2026-02-01',shares:100,amount:9000}];
 assert.equal(investmentPosition(a,fs).valid,false);
});
