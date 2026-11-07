import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
test('settings uses currency rate picker without a manual primary-currency refresh button',()=>{
 const start=code.indexOf("{tab==='settings'&&");
 const end=code.indexOf("{investmentAddMenu&&",start);
 assert.ok(start>=0&&end>start);
 const settings=code.slice(start,end);
 assert.match(settings,/<CurrencyRateSelect\s+value=\{primaryCurrency\}/);
 assert.doesNotMatch(settings,/onClick=\{\(\)=>updatePrimaryRate\(primaryCurrency\)\}/);
 assert.doesNotMatch(settings,/className="preference-rate"/);
});
test('app startup refreshes existing account and primary currency rates automatically',()=>{
 assert.match(code,/if\(!ready\|\|startupRatesRequested\.current\)return/);
 assert.match(code,/const currencies=\[\.\.\.new Set\(\[\.\.\.accounts\.map/);
 assert.match(code,/api\.frankfurter\.dev\/v2\/rate/);
});
test('changing primary currency refreshes rate automatically and menu rates update on selection',()=>{
 assert.match(code,/const changePrimaryCurrency=async value=>/);
 assert.match(code,/if\(activePrimaryCurrencyRef\.current===value\)await updatePrimaryRate\(value\)/);
 assert.match(code,/\},\[ready,tab,primaryCurrency\]\)/);
});
