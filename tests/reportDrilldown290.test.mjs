import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectReportEntries} from '../src/incomeExpenseReport.js';
const component=readFileSync(new URL('../src/IncomeExpenseReport.jsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const rows=[
 {id:'a',date:'2026-11-01',type:'expense',mainCategory:'餐飲',subCategory:'午餐',reportAmount:100},
 {id:'b',date:'2026-11-02',type:'expense',mainCategory:'餐飲',subCategory:'晚餐',reportAmount:200},
 {id:'c',date:'2026-11-02',type:'income',mainCategory:'薪資',reportAmount:900},
 {id:'d',date:'2026-10-31',type:'expense',mainCategory:'餐飲',subCategory:'午餐',reportAmount:50},
 {id:'e',date:'2026-11-02',type:'transfer',mainCategory:'餐飲',reportAmount:999},
];
test('category drilldown returns every matching transaction in selected month',()=>{
 assert.deepEqual(selectReportEntries(rows,{period:'month',date:'2026-11-09',kind:'category',flow:'expense',level:'main',main:'餐飲'}).map(r=>r.id),['b','a']);
 assert.deepEqual(selectReportEntries(rows,{period:'month',date:'2026-11-09',kind:'category',flow:'expense',level:'sub',main:'餐飲',sub:'午餐'}).map(r=>r.id),['a']);
});
test('timeline drilldown includes both income and expense for the selected day/month',()=>{
 assert.deepEqual(selectReportEntries(rows,{period:'month',date:'2026-11-09',kind:'timeline',tick:'2026-11-02'}).map(r=>r.id),['c','b']);
 assert.deepEqual(selectReportEntries(rows,{period:'year',date:'2026-11-09',kind:'timeline',tick:'2026-11'}).map(r=>r.id),['c','b','a']);
 assert.deepEqual(selectReportEntries(rows,{period:'day',date:'2026-11-02',kind:'timeline',tick:'2026-11-02'}).map(r=>r.id),['c','b']);
});
test('report headings omit currency label and drilldown supports original editor',()=>{
 assert.doesNotMatch(component,/<span>\{primaryCurrency\}<\/span>/);
 assert.match(component,/report-details-sheet/);
 assert.match(component,/selectReportEntries\(rows/);
 assert.match(app,/onSelectRow=\{row=>/);
});
