import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('deployment verifies US quote output and includes AAPL',()=>{
 const yml=fs.readFileSync(new URL('../.github/workflows/deploy.yml',import.meta.url),'utf8');
 assert.match(yml,/dist\/us-market-quotes\.json/);
 assert.match(yml,/US:AAPL/);
});
test('US download has alternate server-side source',()=>{
 const source=fs.readFileSync(new URL('../scripts/fetch_us_market_quotes.py',import.meta.url),'utf8');
 assert.match(source,/def fetch_yahoo/);
 assert.match(source,/fetch_with_fallback/);
});
