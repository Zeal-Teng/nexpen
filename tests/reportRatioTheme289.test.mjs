import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {expenseIncomeRatio} from '../src/incomeExpenseReport.js';
const css=readFileSync(new URL('../src/income-expense-report.css', import.meta.url),'utf8');
const component=readFileSync(new URL('../src/IncomeExpenseReport.jsx', import.meta.url),'utf8');
test('expense-income ratio uses expense divided by income',()=>{
 assert.equal(expenseIncomeRatio(100,40),40);
 assert.equal(expenseIncomeRatio(100,120),120);
 assert.equal(expenseIncomeRatio(100,0),0);
 assert.equal(expenseIncomeRatio(0,40),null);
 assert.equal(expenseIncomeRatio(0,0),null);
});
test('report segmented buttons use accent contrast from selected theme',()=>{
 assert.match(css,/\.report-pill-switch button\.selected[\s\S]*?--theme-accent-contrast/);
 assert.match(css,/\.report-pill-switch button \{/);
 assert.match(css,/--theme-surface/);
});
test('timeline and summary show ratio while retaining net amounts',()=>{
 assert.match(component,/report-ratio-summary/);
 assert.match(component,/renderRatio\(report\.income,report\.expense\)/);
 assert.match(component,/renderRatio\(tick\.income,tick\.expense\)/);
 assert.match(component,/format\(tick\.income-tick\.expense\)/);
});
