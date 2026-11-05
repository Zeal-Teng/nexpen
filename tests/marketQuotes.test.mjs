import assert from 'node:assert/strict';
import {rocDate,normalizeQuoteRows,validateQuoteBundle,quoteMarketStatus} from '../src/marketQuotes.js';
for(const [input,expected] of [['1151105','2026-11-05'],['20261105','2026-11-05'],['115/11/05','2026-11-05'],['2026/11/05','2026-11-05'],['2026-11-05','2026-11-05'],['2026-02-30',''],['20261132','']])assert.equal(rocDate(input),expected,input);
const prices=normalizeQuoteRows([{Code:'2330',ClosingPrice:'1,200',Date:'1151105'}],'twse');
assert.equal(prices['2330'].price,1200);
assert.equal(validateQuoteBundle({format:'cyberpulse-market-quotes-v1',quotes:{'2330':{price:1200,date:'20261105',source:'證交所（上市）'}}})['2330'].date,'2026-11-05');
assert.equal(quoteMarketStatus({markets:{twse:{status:'updated',latestDate:'20261105',count:1000},tpex:{status:'cached',latestDate:'1151104',count:900}}}).tpex.status,'cached');
console.log('Market quotes frontend tests passed');
