import test from 'node:test';
import assert from 'node:assert/strict';
import {legacyTrustContributionPatch} from '../src/trustLegacyRepair.js';
import {investmentDiaryRows} from '../src/investmentDiary.js';
import {investmentCashMovement} from '../src/investmentCashFlow.js';
import {investmentPosition} from '../src/investmentLedger.js';
const trust={id:'trust',type:'trust',name:'信託',trustSubsidyRate:20,investmentCost:0,trustShares:0};
const bank={id:'bank',name:'銀行',currency:'TWD'};
test('legacy 12000 gross stays 12000 in diary and bank balance, with 10000 investment cost',()=>{
 const old={id:'old',assetId:'trust',kind:'contribution',amount:12000,shares:100,sourceAccount:'bank',date:'2026-11-11'};
 const patch=legacyTrustContributionPatch(old,trust);assert.equal(patch.personalCost,10000);
 const repaired={...old,...patch};
 assert.equal(investmentDiaryRows([repaired],[trust,bank])[0].amount,12000);
 assert.equal(investmentCashMovement(repaired),-12000);
 assert.equal(investmentPosition(trust,[repaired]).cost,10000);
 assert.equal(legacyTrustContributionPatch(repaired,{...trust,trustSubsidyRate:50}),null);
});
test('explicit historical transaction rate takes precedence over current account default',()=>{
 assert.deepEqual(legacyTrustContributionPatch({kind:'contribution',amount:12000,subsidyRate:20},{...trust,trustSubsidyRate:80}),{subsidyRate:20,personalCost:10000});
});
test('non-trust contributions are not changed',()=>{
 assert.equal(legacyTrustContributionPatch({kind:'contribution',amount:12000},{...trust,type:'policy'}),null);
});
