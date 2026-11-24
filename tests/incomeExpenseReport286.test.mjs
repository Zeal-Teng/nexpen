import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {aggregateIncomeExpense,reportPeriodKey} from '../src/incomeExpenseReport.js';
const rows=[
 {date:'2026-11-01',type:'expense',mainCategory:'餐飲',subCategory:'早餐',reportAmount:120},
 {date:'2026-11-02',type:'expense',mainCategory:'餐飲',subCategory:'午餐',reportAmount:180},
 {date:'2026-11-02',type:'income',mainCategory:'薪資',subCategory:'本薪',reportAmount:40000},
 {date:'2026-11-02',type:'transfer',mainCategory:'轉帳',reportAmount:90000},
 {date:'2026-11-02',type:'adjustment',mainCategory:'校正',reportAmount:90000},
 {date:'2026-11-02',type:'stock',mainCategory:'股票買進',reportAmount:90000},
 {date:'2026-10-31',type:'expense',mainCategory:'餐飲',reportAmount:999},
 {date:'2025-11-02',type:'income',mainCategory:'薪資',reportAmount:20000}
];
test('daily monthly yearly periods and category totals',()=>{
 const month=aggregateIncomeExpense(rows,{date:'2026-11-09',period:'month',flow:'expense'});
 assert.equal(month.expense,300);assert.equal(month.income,40000);assert.equal(month.net,39700);
 assert.equal(month.categories[0].value,300);assert.equal(month.categories[0].percent,100);
 assert.equal(month.count,3);assert.equal(month.timeline.length,2);
 const day=aggregateIncomeExpense(rows,{date:'2026-11-01',period:'day'});
 assert.equal(day.expense,120);assert.equal(day.income,0);
 const year=aggregateIncomeExpense(rows,{date:'2026-11-09',period:'year'});
 assert.equal(year.expense,1299);assert.equal(year.income,40000);
});
test('subcategory drilldown separates entries, and no data returns zero',()=>{
 const report=aggregateIncomeExpense(rows,{date:'2026-11-09',period:'month',level:'sub'});
 assert.deepEqual(report.categories.map(x=>x.name),['午餐','早餐']);
 assert.equal(aggregateIncomeExpense(rows,{date:'2024-01-01',period:'month'}).count,0);
 assert.equal(reportPeriodKey('2026-11-09','year'),'2026');
});
test('report is embedded in diary, reuses day month year and has no duplicate tab',()=>{
 const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(app,/\['reports','報表',ChartPie\]/);
 assert.doesNotMatch(app,/tab==='reports'&&<IncomeExpenseReport/);
 assert.match(app,/diaryPanel==='analysis'&&<IncomeExpenseReport embedded period=\{diaryView\} date=\{date\}/);
 assert.doesNotMatch(app,/diary-content-switch/);
 assert.match(app,/className={`fab diary-mode-fab/);
 assert.match(app,/diaryPanel==='transactions'\?' diary-mode-fab-stacked'/);
 assert.match(app,/tab!=='daily'\|\|diaryPanel==='transactions'/);
 assert.match(app,/diaryPanel==='transactions'&&<section className=\"daily-transactions/);
 const component=readFileSync(new URL('../src/IncomeExpenseReport.jsx',import.meta.url),'utf8');
 assert.match(component,/const period=embedded\?externalPeriod/);
 assert.match(component,/const date=embedded\?externalDate/);
 assert.match(component,/!embedded&&<section className=\"glass report-panel/);
 assert.match(component,/!embedded&&<div className=\"report-summary-grid/);
 const style=readFileSync(new URL('../src/income-expense-report.css',import.meta.url),'utf8');
 assert.doesNotMatch(style,/diary-content-switch/);
 assert.match(style,/diary-mode-fab-stacked/);
 assert.match(style,/embedded-report/);
});
