import test from 'node:test';
import assert from 'node:assert/strict';
import {collectClosingQuotes,parseDatedQuotes} from '../src/manualMarketQuotes.js';
const ok=data=>({ok:true,json:async()=>data});
test('dated endpoints precede fallback, search previous weekday, verify dates',async()=>{
 const calls=[];const tw=['2330','台積電',0,0,0,0,0,0,'1,200','<span style="color:green">-</span>','5'];const tp=['6488','環球晶','100','-2',0,0,0,0,0,0,0];
 const r=await collectClosingQuotes({codes:['2330','6488'],manual:true,today:'2026-11-11',fetcher:async url=>{calls.push(url);if(url.includes('MI_INDEX'))return ok(url.includes('20261110')?{stat:'OK',date:'20261110',tables:[{title:'每日收盤行情',data:[tw]}]}:{stat:'無資料'});if(url.includes('dailyQuotes'))return ok(url.includes('2026%2F11%2F10')?{date:'20261110',tables:[{data:[tp]}]}:{date:'20261109',tables:[{data:[tp]}]});return ok([]);}});
 assert.equal(r.got['2330'].date,'2026-11-10');assert.equal(r.got['2330'].change,-5);assert.equal(r.got['6488'].price,100);assert.ok(calls[0].includes('MI_INDEX'));assert.ok(calls[1].includes('dailyQuotes'));assert.deepEqual(parseDatedQuotes({date:'20261109',tables:[{data:[tp]}]},'tpex','2026-11-10'),{});
});
