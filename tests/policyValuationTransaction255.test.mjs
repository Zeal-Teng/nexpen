import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/InvestmentAssets.jsx', import.meta.url),'utf8');

// A policy valuation causes rebuildPolicy() to read investmentFlows and
// investmentValuations, and to update accounts. Dexie must include *all three*
// in the parent transaction, even when editing/deleting a valuation only.
test('editing a policy valuation includes all stores read by rebuildPolicy',()=>{
 const start=source.indexOf("}else if(dialog==='value'){");
 assert.ok(start>=0,'policy valuation submit handler exists');
 const portion=source.slice(start, source.indexOf("setDialog('');setEditingEntry(null);await onChanged()",start));
 assert.match(portion,/db\.transaction\('rw',db\.investmentFlows,db\.investmentValuations,db\.accounts,async\(\)=>\{/);
 assert.match(portion,/await rebuildPolicy\(active\)/);
});

test('deleting a policy valuation includes all stores read by rebuildPolicy',()=>{
 const start=source.indexOf("if(entry.entry==='valuation'){");
 assert.ok(start>=0,'policy valuation deletion handler exists');
 const portion=source.slice(start,source.indexOf('}else{',start));
 assert.match(portion,/db\.transaction\('rw',db\.investmentFlows,db\.investmentValuations,db\.accounts,async\(\)=>\{/);
 assert.match(portion,/await rebuildPolicy\(active\)/);
});
