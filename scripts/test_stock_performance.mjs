import assert from 'node:assert/strict';
import { analyzeStockPerformance } from '../src/stockPerformance.js';
const trades=[
 {id:'b1',symbol:'2027',action:'buy',date:'2026-01-01',shares:100,price:37.4,fee:4,totalAmount:3744},
 {id:'s1',symbol:'2027',action:'sell',date:'2026-01-02',shares:40,price:50,fee:3,tax:6,totalAmount:1991},
 {id:'d1',symbol:'2027',action:'dividend',date:'2026-01-03',amount:100},
 {id:'s2',symbol:'2027',action:'sell',date:'2026-01-04',shares:60,price:45,fee:4,tax:8,totalAmount:2688},
 {id:'b2',symbol:'2330',action:'buy',date:'2026-01-01',shares:1000,price:100,fee:85,totalAmount:100085},
 {id:'s3',symbol:'2330',action:'sell',date:'2026-01-02',shares:100,price:102,fee:9,tax:31,totalAmount:10160},
];
const [closed,partial]=analyzeStockPerformance(trades);
assert.equal(closed.symbol,'2027');
assert.equal(closed.shares,0);
assert.equal(closed.isClosed,true);
assert.equal(closed.realized,935);
assert.equal(closed.dividends,100);
assert.equal(closed.realizedBasis,3744);
assert.ok(Math.abs(closed.realizedPercent-935/3744*100)<1e-8);
assert.equal(partial.symbol,'2330');
assert.equal(partial.shares,900);
assert.equal(partial.isClosed,false);
assert.ok(Math.abs(partial.cost-90076.5)<1e-7);
assert.ok(Math.abs(partial.realized-(10160-10008.5))<1e-7);
const bad=analyzeStockPerformance([{id:'s4',symbol:'X',action:'sell',date:'2026-01-01',shares:1,price:100,totalAmount:100}])[0];
assert.equal(bad.realized,0);assert.equal(bad.issues.length,1);
console.log('股票交易績效測試通過：清倉、部分賣出、費稅、股利、歷史異常');
