import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {backupFileName} from '../src/backupFileName.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('backup includes local date and time with only json extension',()=>{
 const date=new Date(2026,10,12,8,33,15);
 assert.equal(backupFileName(date),'NEXPEN_20261112_083315.json');
});
test('net worth trend defaults to 7 days',()=>{
 assert.match(read('../src/NetWorthTrend.jsx'),/const \[range,setRange\]=useState\(7\)/);
});
test('backup writes only json file and uses timestamp filename',()=>{
 const app=read('../src/App.jsx');
 assert.match(app,/const name=backupFileName\(\)/);
 assert.match(app,/type:'application\/json'/);
 assert.doesNotMatch(app,/text\/plain|\.txt['`]/);
});
test('pie chart icon replaced in diary and reports',()=>{
 assert.doesNotMatch(read('../src/App.jsx'),/ChartPie/);
 assert.doesNotMatch(read('../src/IncomeExpenseReport.jsx'),/ChartPie/);
});
test('portfolio select uses transparent background',()=>{
 assert.match(read('../src/style.css'),/data-theme="portfolio"\] \.app-shell \.smart-select,[\s\S]*?background:transparent!important/);
});
