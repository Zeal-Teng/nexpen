import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const jsx=readFileSync(new URL('../src/IncomeExpenseReport.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/income-expense-report.css',import.meta.url),'utf8');
test('ranking amount and percentage are together on right without count',()=>{
 assert.match(jsx,/className="report-category-values"/);
 assert.match(jsx,/\{format\(g.value\)\}/);
 assert.match(jsx,/\{g.percent.toFixed\(1\)\}%/);
 assert.doesNotMatch(jsx,/\{g.count\} \{t.records\}/);
 assert.match(css,/\.report-category-values\s*\{[^}]*align-items:flex-end/);
});
test('detail heading and summary do not show transaction counts',()=>{
 assert.doesNotMatch(jsx,/\{detailRows.length\} \{t.records\}/);
 assert.doesNotMatch(jsx,/\{report.count\} \{t.records\}/);
});
