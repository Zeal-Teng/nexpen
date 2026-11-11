import test from 'node:test';
import assert from 'node:assert/strict';
import {investmentCashMovement} from '../src/investmentCashFlow.js';
import {investmentDiaryRows} from '../src/investmentDiary.js';
import {investmentPosition} from '../src/investmentLedger.js';
import {trustContributionBreakdown} from '../src/trustSubsidy.js';

test('company deposits 2000 then personal account transfers 12000; investment cost 10000',()=>{
 const trust={id:'trust',name:'持股信託',type:'trust',trustShares:0,investmentCost:0,currency:'TWD'};
 const bank={id:'bank',name:'銀行',currency:'TWD'};
 const flow={id:'add',assetId:'trust',kind:'contribution',amount:12000,shares:100,sourceAccount:'bank',date:'2026-11-11',...trustContributionBreakdown(12000,20)};
 assert.equal(investmentCashMovement(flow),-12000);
 assert.equal(investmentDiaryRows([flow],[trust,bank])[0].amount,12000);
 assert.equal(investmentPosition(trust,[flow]).cost,10000);
 assert.equal(2000 + investmentCashMovement(flow),-10000);
});
