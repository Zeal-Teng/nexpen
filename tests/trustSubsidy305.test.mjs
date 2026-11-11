import test from 'node:test';
import assert from 'node:assert/strict';
import {trustContributionBreakdown,contributionPersonalCost,normalizeTrustSubsidyRate} from '../src/trustSubsidy.js';
import {investmentPosition,redemptionCostAt} from '../src/investmentLedger.js';
import {investmentCashMovement} from '../src/investmentCashFlow.js';
import {investmentDiaryRows} from '../src/investmentDiary.js';
const account={id:'trust1',type:'trust',investmentCost:10000,trustShares:100,trustSubsidyRate:20,currency:'TWD',name:'信託'};
const contribution=(id,amount,shares,rate,date)=>({id,assetId:account.id,kind:'contribution',amount,shares,date,...trustContributionBreakdown(amount,rate),sourceAccount:'bank1'});
test('12000 total 20% support -> 10000 personal and 2000 employer',()=>{
 const x=trustContributionBreakdown(12000,20);
 assert.equal(x.personalCost,10000);assert.equal(x.employerSubsidy,2000);
 assert.equal(investmentCashMovement({kind:'contribution',amount:12000,personalCost:x.personalCost}),-12000);
});
test('trust ledger counts personal contribution basis and realized redemption uses weighted cost',()=>{
 const f=contribution('a',12000,100,20,'2026-01-01');
 assert.equal(investmentPosition(account,[f]).cost,20000);
 assert.equal(investmentPosition(account,[f]).shares,200);
 const r={id:'r',assetId:'trust1',kind:'redemption',amount:12000,shares:50,date:'2026-02-01'};
 assert.equal(redemptionCostAt(account,[f],r).costBasis,5000);
 const pos=investmentPosition(account,[f,r]);assert.equal(pos.cost,15000);assert.equal(pos.realized,7000);assert.equal(pos.shares,150);
});
test('changing default rate does not alter historical contribution basis, legacy flow remains full cost',()=>{
 const f=contribution('a',12000,100,20,'2026-01-01');
 assert.equal(investmentPosition({...account,trustSubsidyRate:80},[f]).cost,20000);
 const legacy={id:'old',assetId:'trust1',kind:'contribution',amount:12000,shares:100,date:'2025-01-01'};
 assert.equal(contributionPersonalCost(legacy),12000);
 assert.equal(investmentPosition(account,[legacy]).cost,22000);
});
test('investment diary reports full payment while trust cost remains personal basis',()=>{
 const f=contribution('a',12000,100,20,'2026-01-01');
 const rows=investmentDiaryRows([f],[account,{id:'bank1',name:'Bank',currency:'TWD'}]);
 assert.equal(rows[0].amount,12000);assert.equal(investmentCashMovement(f),-12000);assert.equal(investmentPosition(account,[f]).cost,20000);
});
test('invalid subsidy percentages rejected',()=>{
 assert.throws(()=>normalizeTrustSubsidyRate(-1));assert.throws(()=>normalizeTrustSubsidyRate(2000));assert.equal(normalizeTrustSubsidyRate('0'),0);
});
