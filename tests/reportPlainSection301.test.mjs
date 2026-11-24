import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const jsx=readFileSync(new URL('../src/IncomeExpenseReport.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/income-expense-report.css',import.meta.url),'utf8');
test('v301 analysis uses an unframed section while preserving both views',()=>{
 assert.match(jsx,/className="report-panel report-unified-panel report-plain-section"/);
 assert.doesNotMatch(jsx,/className="glass report-panel report-unified-panel"/);
 assert.match(jsx,/reportView==='category'/);
 assert.match(jsx,/reportView==='trend'/);
 assert.match(jsx,/report-drilldown-trigger/);
 assert.match(css,/\.report-unified-panel\.report-plain-section\s*\{[^}]*background:transparent!important;[^}]*border:0!important;[^}]*box-shadow:none!important;/s);
});
