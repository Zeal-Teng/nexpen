import test from 'node:test';import assert from 'node:assert/strict';
import {fetchHistoricalInvestmentRate} from '../src/investmentHistoricalFx.js';
const mock=(rows)=>async url=>({ok:true,json:async()=>rows,url});
test('uses only latest available quote on or before valuation date',async()=>{
 let url=''; const rate=await fetchHistoricalInvestmentRate('USD','TWD','2025-11-09',{fetchImpl:async u=>{url=u;return {ok:true,json:async()=>[{date:'2025-11-07',base:'USD',quote:'TWD',rate:30.5},{date:'2025-11-10',base:'USD',quote:'TWD',rate:31.2}]}}});
 assert.equal(rate.date,'2025-11-07');assert.equal(rate.rate,30.5);assert.match(url,/to=2025-11-09/);
});
test('same currency is 1',async()=>assert.equal((await fetchHistoricalInvestmentRate('TWD','TWD','2025-11-09')).rate,1));
test('missing history is explicit',async()=>await assert.rejects(fetchHistoricalInvestmentRate('USD','TWD','2025-11-09',{fetchImpl:mock([])}),/沒有可用/));
