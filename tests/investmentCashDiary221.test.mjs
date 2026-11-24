import test from 'node:test';
import assert from 'node:assert/strict';
import {investmentDiaryRows} from '../src/investmentDiary.js';
import {computeNetWorth} from '../src/netWorth.js';
import {matchesDiaryType,availableDiaryFilters} from '../src/diaryFilterOptions.js';

const accounts=[
 {id:'bank',name:'銀行',type:'bank',currency:'TWD',openingBalance:1000},
 {id:'trust',name:'員工持股信託',type:'trust',currency:'TWD',trustShares:100,investmentCost:5000}
];
const flows=[{id:'a',assetId:'trust',kind:'redemption',date:'2026-11-05',sourceAccount:'bank',shares:20,amount:1400}];

test('redemption appears in cash-account diary once with a stable investment flow identity',()=>{
 const rows=investmentDiaryRows(flows,accounts);
 assert.equal(rows.length,1);
 assert.equal(rows[0].id,'investment-flow:a');
 assert.equal(rows[0].account,'bank');
 assert.equal(rows[0].amount,1400);
 assert.equal(rows[0].type,'investment');
 assert.equal(rows[0].investmentAction,'redemption');
 assert.equal(matchesDiaryType(rows[0],'investment'),true);
 assert.deepEqual(availableDiaryFilters(rows,accounts).types,['investment']);
});

test('one redemption credits the account once, not twice via a diary projection',()=>{
 const net=computeNetWorth({accounts,records:[],stocks:[],investmentFlows:flows,quotes:{},includedHoldings:[]});
 assert.equal(net.assets.find(a=>a.id==='deposit')?.amount,2400);
});

test('unlinked historical flows are not claimed as deposited and do not appear in bank diary',()=>{
 assert.equal(investmentDiaryRows([{...flows[0],sourceAccount:''}],accounts).length,0);
});
