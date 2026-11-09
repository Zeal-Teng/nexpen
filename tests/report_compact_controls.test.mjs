import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const jsx=readFileSync(new URL('../src/IncomeExpenseReport.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/income-expense-report.css',import.meta.url),'utf8');
test('report uses compact flow controls and bottom sheet for category level',()=>{
 assert.match(jsx,/report-compact-filters/);
 assert.match(jsx,/report-flow-toggle/);
 assert.match(jsx,/report-level-picker/);
 assert.match(jsx,/report-level-backdrop/);
 assert.match(jsx,/setLevel\(k\);setLevelSheetOpen\(false\)/);
 assert.doesNotMatch(jsx,/className="report-switches"/);
});
test('report view navigation is underlined, not filled pills',()=>{
 assert.match(css,/v300: compact analytics navigation/);
 assert.match(css,/report-view-tabs button.selected[\s\S]*?border-bottom-color/);
});
