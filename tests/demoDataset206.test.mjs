import assert from 'node:assert/strict';
import { createDemoDataset } from '../src/demoDataset.js';
import { defaultCategories } from '../src/categoryPresets.js';
import { calculateLots } from '../src/stockLots.js';
const data=createDemoDataset();
assert.ok(data.accounts.length>=6,'multiple account types');
assert.ok(data.records.length>=30,'multiple months of diary data');
assert.ok(new Set(data.records.map(r=>r.type)).has('transfer'),'transfer example');
assert.ok(data.recurring.length>=2,'recurring examples');
assert.ok(data.investmentFlows.length&&data.investmentValuations.length,'investment asset history');
assert.ok(data.settings.some(s=>s.key==='netWorthGoalTwd'),'net worth goal');
assert.equal(data.netWorthHistory.length,120,'demo includes 120 daily net worth snapshots');
assert.equal(new Set(data.netWorthHistory.map(p=>p.date)).size,120,'snapshot dates unique');
assert.ok(data.netWorthHistory.every((p,i,a)=>i===0||p.date>a[i-1].date),'snapshots chronologically ordered');
assert.ok(data.netWorthHistory.every(p=>p.netWorth===p.totalAssets-p.totalLiabilities),'net worth snapshots reconcile');
assert.ok(new Set(data.netWorthHistory.slice(-7).map(p=>p.netWorth)).size>3,'7-day sample has visible change');
assert.ok(new Set(data.netWorthHistory.slice(-30).map(p=>p.netWorth)).size>15,'30-day sample has visible change');
assert.ok(new Set(data.netWorthHistory.slice(-90).map(p=>p.netWorth)).size>50,'90-day sample has visible change');
const accountIds=new Set(data.accounts.map(a=>a.id));
const ids=[...data.accounts,...data.records,...data.stocks,...data.recurring,...data.investmentFlows].map(x=>x.id);
assert.equal(new Set(ids).size,ids.length,'all seed IDs unique');
for(const row of data.records){
 assert.ok(row.amount>0);
 if(row.type==='transfer'){assert.ok(accountIds.has(row.fromAccount)&&accountIds.has(row.toAccount));continue;}
 assert.ok(accountIds.has(row.account));
 assert.ok(defaultCategories[row.type]?.[row.mainCategory]?.includes(row.subCategory),`valid category ${row.mainCategory} / ${row.subCategory}`);
}
for(const schedule of data.recurring){assert.ok(schedule.nextDate>='2026-01-01');assert.ok(defaultCategories[schedule.type]?.[schedule.mainCategory]?.includes(schedule.subCategory));}
assert.equal(calculateLots(data.stocks).issues.length,0,'stock holdings have no invalid sales');
assert.ok(data.accounts.some(a=>a.type==='trust')&&data.accounts.some(a=>a.type==='policy'),'investment types');
console.log('Demo dataset structure, transaction references and stock lot validation passed.');
