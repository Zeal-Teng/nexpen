import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSavingsProjection,savingsProjectionComparison,savingsCashFlows,calculateXirr} from '../src/savingsPolicy.js';
test('normalizes annual surrender projections without affecting valuation',()=>{
 const rows=normalizeSavingsProjection([{year:'10',endValue:'151550.98',nextValue:'151561.37',cumulativePremium:'121099.76'},{year:'1',endValue:'10368.16'}]);
 assert.deepEqual(rows.map(r=>r.year),[1,10]);assert.ok(savingsProjectionComparison(rows[1])>25);
 assert.equal(savingsProjectionComparison(rows[0]),null);
});
test('rejects repeated or invalid projections',()=>{
 assert.throws(()=>normalizeSavingsProjection([{year:1,endValue:10},{year:1,endValue:20}]));
 assert.throws(()=>normalizeSavingsProjection([{year:1,endValue:-10}]));
});
test('XIRR for a single year 100 to 110 is ~10%',()=>{
 const result=calculateXirr([{date:'2025-01-01',amount:-100},{date:'2026-01-01',amount:110}]);
 assert.ok(Math.abs(result-10)<0.02);
});
test('XIRR uses historical premiums payouts and terminal value',()=>{
 const flows=[{assetId:'x',kind:'contribution',date:'2023-01-01',amount:100},{assetId:'x',kind:'yield',date:'2024-01-01',amount:5},{assetId:'y',kind:'contribution',date:'2023-01-01',amount:999}];
 const cash=savingsCashFlows(flows,'x','2025-01-01',120);
 assert.equal(cash.length,3);assert.deepEqual(cash.map(x=>x.amount),[-100,5,120]);assert.ok(calculateXirr(cash)>10);
});
test('returns no annualized result for same-day or cashflows without outflow',()=>{
 assert.equal(calculateXirr([{date:'2026-01-01',amount:-100},{date:'2026-01-01',amount:110}]),null);
 assert.equal(calculateXirr([{date:'2025-01-01',amount:10},{date:'2026-01-01',amount:20}]),null);
});
