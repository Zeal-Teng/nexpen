import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const breakdown=readFileSync(new URL('../src/NetWorthBreakdown.jsx',import.meta.url),'utf8');
test('net worth trend is shown before goal',()=>{
 assert.ok(breakdown.indexOf('<NetWorthTrend ') < breakdown.indexOf('<NetWorthGoal '));
});
test('currency choices show compact labels and right-aligned relative rates, without date',()=>{
 assert.match(app,/function CurrencyRateSelect/);
 assert.match(app,/const formattedRate=\(code\)=>/);
 assert.match(app,/twdRate\/baseRate/);
 assert.match(app,/currency-rate-option-value/);
 assert.match(app,/currency-rate-option-label/);
 assert.doesNotMatch(app,/formatted\?`1 \${code} =/);
 assert.match(app,/rates=\{currencyMenuRates\}/);
});
test('settings refreshes currency menu rates on entry',()=>{
 assert.match(app,/if\(!ready\|\|tab!=='settings'\)return/);
 assert.match(app,/Promise\.allSettled\(codes\.map/);
});
test('primary currency change fetches the chosen rate again',()=>{
 assert.match(app,/if\(activePrimaryCurrencyRef\.current===value\)await updatePrimaryRate\(value\)/);
 assert.match(app,/if\(activePrimaryCurrencyRef\.current!==currency\)return/);
});
