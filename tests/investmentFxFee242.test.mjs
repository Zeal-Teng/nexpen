import test from 'node:test';
import assert from 'node:assert/strict';
import {investmentCashMovement,redemptionGrossInAccountCurrency,suggestedRedemptionRate} from '../src/investmentCashFlow.js';
import {investmentDiaryRows} from '../src/investmentDiary.js';
import {computeNetWorth} from '../src/netWorth.js';

const accounts=[
 {id:'bankUSD',name:'美元銀行',type:'bank',currency:'USD',fxRate:32,openingBalance:500},
 {id:'bankTWD',name:'台幣銀行',type:'bank',currency:'TWD',openingBalance:1000},
 {id:'policy',name:'美元保單',type:'policy',currency:'USD',fxRate:32,investmentCost:400,policyValue:800},
];
const original={id:'r1',assetId:'policy',sourceAccount:'bankTWD',kind:'redemption',date:'2026-11-07',amount:100,redemptionExchangeRate:31.5,redemptionFee:30};
test('cross currency rate is destination units per one asset unit',()=>{
 assert.equal(suggestedRedemptionRate(accounts[2],accounts[1]),32);
 assert.equal(suggestedRedemptionRate(accounts[2],accounts[0]),1);
 assert.equal(suggestedRedemptionRate({currency:'USD'},accounts[1]),null);
 assert.equal(investmentCashMovement(original),3120);
 assert.equal(redemptionGrossInAccountCurrency(original),3150);
});
test('two entries in diary: gross redeemed money and one fee expense, without duplicate ledger charge',()=>{
 const rows=investmentDiaryRows([original],accounts);
 assert.equal(rows.length,2);
 assert.deepEqual(rows.map(x=>x.id),['investment-flow:r1','investment-fee:r1']);
 assert.equal(rows[0].amount,3150);
 assert.equal(rows[1].type,'expense');
 assert.equal(rows[1].subCategory,'贖回手續費');
 assert.equal(rows[1].amount,30);
 assert.equal(rows[1].account,'bankTWD');
 assert.equal(rows[0].investmentFlowId,rows[1].investmentFlowId);
});
test('balance is derived from the original flow and automatically updates on edit/delete',()=>{
 const balance=(flows)=>computeNetWorth({accounts,records:[],stocks:[],investmentFlows:flows,quotes:{}}).assets.find(x=>x.id==='deposit')?.amount;
 // Deposit group also includes existing USD 500 (=TWD 16000) and TWD 1000.
 assert.equal(balance([original]),16000+1000+3120);
 assert.equal(balance([{...original,redemptionExchangeRate:30,redemptionFee:50}]),16000+1000+2950);
 assert.equal(balance([]),16000+1000);
});
test('legacy redemption with no rate remains 1:1; no fee has one diary row',()=>{
 const legacy={...original,redemptionExchangeRate:undefined,redemptionFee:undefined};
 assert.equal(investmentCashMovement(legacy),100);
 assert.equal(investmentDiaryRows([legacy],accounts).length,1);
});
