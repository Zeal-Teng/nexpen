import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const component=readFileSync(new URL('../src/IncomeExpenseReport.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/income-expense-report.css',import.meta.url),'utf8');
test('v298 uses one zero-centered bi-directional bar for income and expenses',()=>{
 assert.match(component,/report-bidirectional-bars/);
 assert.match(component,/report-bidirectional-half expense/);
 assert.match(component,/report-bidirectional-half income/);
 assert.match(component,/tick\.expense\/maxTick\*100/);
 assert.match(component,/tick\.income\/maxTick\*100/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
 assert.match(css,/left:50%/);
 assert.match(css,/justify-content:flex-end/);
 assert.match(css,/justify-content:flex-start/);
 assert.doesNotMatch(component,/TrendLineChart/);
});
test('v298 retains monthly ratio and clickable trend drilldown',()=>{
 assert.match(component,/renderRatio\(monthlyReport\.income,monthlyReport\.expense\)/);
 assert.match(component,/kind:'timeline',tick:tick\.key/);
 assert.match(component,/period==='year'&&<strong>\{renderRatio\(tick\.income,tick\.expense\)\}/);
});
