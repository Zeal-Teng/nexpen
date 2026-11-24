import assert from 'node:assert/strict';
import {createDemoDataset} from '../src/demoDataset.js';
import {investmentProductPosition,investmentProductValue,validateProductTrade} from '../src/investmentProducts.js';
import {investmentCashMovement} from '../src/investmentCashFlow.js';
import {savingsCashFlows,calculateXirr} from '../src/savingsPolicy.js';
import {readFileSync} from 'node:fs';
const data=createDemoDataset();
const types=['fund','bond','savings','termDeposit'];
assert.deepEqual([...new Set(data.investmentProducts.map(p=>p.type))].sort(),types.sort());
assert.equal(data.investmentProducts.length,8);
const acc=new Map(data.accounts.map(a=>[a.id,a]));
const ids=new Set(data.investmentProducts.map(p=>p.id));
assert.equal(ids.size,data.investmentProducts.length);
for(const asset of data.investmentProducts){
 const position=investmentProductPosition(asset,data.investmentFlows);
 assert.ok(position.valid,`invalid product lots: ${asset.id}`);
 assert.ok(position.units>0,`no current holding: ${asset.id}`);
 assert.ok(Number.isFinite(investmentProductValue(asset,position)));
 const related=data.investmentFlows.filter(f=>f.assetId===asset.id);
 assert.ok(related.some(f=>f.kind==='contribution'),`missing contribution ${asset.id}`);
 for(const f of related){
  assert.ok(/^\d{4}-\d\d-\d\d$/.test(f.date));
  if(f.historical){
   assert.equal(asset.type,'savings');assert.equal(f.kind,'contribution');
   assert.equal(f.sourceAccount,'');assert.equal(investmentCashMovement(f),0);
  }else{assert.ok(acc.has(f.sourceAccount),`missing account for ${f.id}`)}
  assert.equal(validateProductTrade(asset,related.filter(x=>x.id!==f.id),f,f.historical?null:acc.get(f.sourceAccount)),true);
 }
}
assert.ok(data.investmentProducts.some(p=>p.type==='fund'&&data.investmentFlows.some(f=>f.assetId===p.id&&f.kind==='redemption')));
assert.ok(data.investmentProducts.some(p=>p.type==='bond'&&data.investmentFlows.some(f=>f.assetId===p.id&&f.kind==='yield')));
assert.ok(data.investmentProducts.some(p=>p.type==='termDeposit'&&data.investmentFlows.some(f=>f.assetId===p.id&&f.kind==='yield')));
const savings=data.investmentProducts.find(p=>p.id==='demo-savings-usd');
assert.ok(savings.projectionRows.length>=4);
const annual=savingsCashFlows(data.investmentFlows,savings.id,savings.priceDate,savings.price);
assert.ok(annual.length>=7);
assert.ok(Number.isFinite(calculateXirr(annual)));
// The demo uses its own IndexedDB name and refuses personal database seeding.
assert.match(readFileSync('src/db.js','utf8'),/isDemoMode \? 'nexpen_demo_sandbox_v1' : 'cyberpulse_liquid_v1'/);
assert.match(readFileSync('src/demoData.js','utf8'),/if\(!isDemoMode\)throw Error\('Cannot seed a personal database'\)/);
console.log('Standalone investment demo scenarios validated');
