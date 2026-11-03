import assert from 'node:assert/strict';
import {calculateLots,buyLotsForSale} from '../src/stockLots.js';

const buys=[
 {id:'buy1',symbol:'2330',action:'buy',date:'2026-01-01',shares:1000,price:100,totalAmount:100100},
 {id:'buy2',symbol:'2330',action:'buy',date:'2026-01-02',shares:500,price:120,totalAmount:60060}
];
const matched={id:'sell1',symbol:'2330',action:'sell',date:'2026-01-03',shares:400,price:130,totalAmount:51940,matchedBuyId:'buy2'};
const a=calculateLots([...buys,matched]);
assert.equal(a.issues.length,0);
const g=a.groups[0];
assert.equal(g.shares,1100);
assert.equal(g.cost,112112);
assert.equal(g.realizedBasis,48048);
assert.equal(g.realized,3892);
assert.equal(a.rows.get('sell1').matchedBuy.id,'buy2');
assert.equal(buyLotsForSale([...buys,matched],'2330','2026-01-04').find(l=>l.id==='buy2').remaining,100);
const legacy=calculateLots([...buys,{...matched,matchedBuyId:null}]).groups[0];
assert.ok(Math.abs(legacy.realizedBasis-(160160*400/1500))<1e-8);
assert.equal(calculateLots([...buys,{...matched,matchedBuyId:'wrong'}]).issues.length,1);
assert.equal(calculateLots([...buys,matched,{id:'sell2',symbol:'2330',action:'sell',date:'2026-01-04',shares:101,totalAmount:13000,matchedBuyId:'buy2'}]).issues.length,1);
assert.equal(buyLotsForSale([...buys,matched],'2330','2026-01-01').length,1);
console.log('All stock-lot accounting tests passed');
