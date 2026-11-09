import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {aggregateIncomeExpense,expenseIncomeRatio} from '../src/incomeExpenseReport.js';
const component=readFileSync(new URL('../src/IncomeExpenseReport.jsx',import.meta.url),'utf8');
const rows=[
 {type:'expense',date:'2026-11-02',reportAmount:100},
 {type:'expense',date:'2026-11-05',reportAmount:200},
 {type:'income',date:'2026-11-25',reportAmount:1000},
 {type:'income',date:'2026-12-01',reportAmount:2000}
];
test('monthly expense ratio includes income on later dates, not just daily income',()=>{
 const day=aggregateIncomeExpense(rows,{period:'day',date:'2026-11-05'});
 const month=aggregateIncomeExpense(rows,{period:'month',date:'2026-11-05'});
 assert.equal(expenseIncomeRatio(day.income,day.expense),null);
 assert.equal(expenseIncomeRatio(month.income,month.expense),30);
});
test('month ratio excludes other months and yearly trend uses monthly buckets',()=>{
 const november=aggregateIncomeExpense(rows,{period:'month',date:'2026-11-30'});
 assert.equal(november.income,1000);
 const annual=aggregateIncomeExpense(rows,{period:'year',date:'2026-11-09'});
 assert.deepEqual(annual.timeline.map(t=>t.key),['2026-11','2026-12']);
 assert.equal(expenseIncomeRatio(annual.timeline[0].income,annual.timeline[0].expense),30);
 assert.equal(expenseIncomeRatio(annual.timeline[1].income,annual.timeline[1].expense),0);
});
test('UI never shows daily tick ratios; monthly totals are used for daily/month views',()=>{
 assert.match(component,/period==='year'&&<strong>\{renderRatio\(tick\.income,tick\.expense\)\}/);
 assert.match(component,/renderRatio\(monthlyReport\.income,monthlyReport\.expense\)/);
});
