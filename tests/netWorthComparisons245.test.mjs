import test from 'node:test';
import assert from 'node:assert/strict';
import {netWorthComparisons} from '../src/netWorthComparisons.js';
const entry=(date,netWorth)=>({date,netWorth});
test('range and daily compare are independent',()=>{
 const x=netWorthComparisons([entry('2026-11-01',100),entry('2026-11-05',120),entry('2026-11-06',150)],7);
 assert.equal(x.period.change,50);
 assert.equal(x.daily.change,30);
 assert.equal(x.daily.isPreviousDay,true);
});
test('missing previous day does not pretend the change is yesterday',()=>{
 const x=netWorthComparisons([entry('2026-11-01',100),entry('2026-11-04',110),entry('2026-11-06',140)],7);
 assert.equal(x.daily.isPreviousDay,false);
 assert.equal(x.daily.first.date,'2026-11-04');
 assert.equal(x.daily.change,30);
});
test('one snapshot, no comparison; zero baseline percent unknown',()=>{
 assert.equal(netWorthComparisons([entry('2026-11-06',20)],7).daily,null);
 assert.equal(netWorthComparisons([entry('2026-11-05',0),entry('2026-11-06',20)],7).period.pct,null);
});
test('period start uses earliest snapshot within available window',()=>{
 const x=netWorthComparisons([entry('2026-10-20',70),entry('2026-11-04',90),entry('2026-11-06',100)],7);
 assert.equal(x.period.first.date,'2026-11-04');
 assert.equal(x.period.change,10);
});
