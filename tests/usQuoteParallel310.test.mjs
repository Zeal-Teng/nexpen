import test from 'node:test';
import assert from 'node:assert/strict';
import {collectClosingQuotes} from '../src/manualMarketQuotes.js';

test('US quote file starts loading before lengthy TW/TPEx date lookup',async()=>{
 const calls=[];
 const fetcher=async url=>{
  calls.push(url);
  if(url.includes('us-market-quotes.json'))return {ok:true,json:async()=>({quotes:{'US:AAPL':{price:207.4,date:'2026-11-10'}}})};
  if(url.includes('market-quotes.json'))return {ok:true,json:async()=>({format:'cyberpulse-market-quotes-v1',quotes:{}})};
  if(url.includes('/api/history/'))return {ok:true,json:async()=>({stat:'休市',tables:[]})};
  if(url.includes('/api/quotes/'))return {ok:true,json:async()=>([])};
  throw Error('CORS');
 };
 const result=await collectClosingQuotes({codes:new Set(['US:AAPL','2330']),manual:true,dev:true,today:'2026-11-11',bundleUrl:'/nexpen/market-quotes.json',fetcher});
 assert.match(calls[0],/us-market-quotes\.json/);
 assert.equal(result.got['US:AAPL'].price,207.4);
});
