import assert from 'node:assert/strict';
import { availableDiaryFilters, diaryFilterType, matchesDiaryType } from '../src/diaryFilterOptions.js';

const accounts=[{id:1,name:'國泰世華'},{id:2,name:'新光人壽'},{id:3,name:'現金'}];
const rows=[
 {type:'expense', account:1, amount:50},
 {type:'income', account:1, amount:100},
 {type:'transfer',fromAccount:1,toAccount:3,amount:80},
 {type:'income',isStockDividend:true,account:3,amount:5},
];
assert.deepEqual(availableDiaryFilters([],accounts), {types:[],accounts:[]});
assert.deepEqual(availableDiaryFilters(rows,accounts).types,['expense','income','transfer','stock']);
assert.deepEqual(availableDiaryFilters(rows,accounts).accounts.map(a=>a.id),[1,3]);
assert.deepEqual(availableDiaryFilters(rows,accounts,'all','2').types,[]);
assert.deepEqual(availableDiaryFilters(rows,accounts,'income','all').accounts.map(a=>a.id),[1]);
assert.deepEqual(availableDiaryFilters(rows,accounts,'stock','all').accounts.map(a=>a.id),[3]);
assert.deepEqual(availableDiaryFilters(rows,accounts,'transfer','all').accounts.map(a=>a.id),[1,3]);
assert.deepEqual(availableDiaryFilters(rows,accounts,'all','3').types,['transfer','stock']);
assert.equal(diaryFilterType(rows[3]),'stock');
assert.equal(matchesDiaryType(rows[3],'income'),false);
assert.equal(matchesDiaryType(rows[3],'stock'),true);
assert.deepEqual(availableDiaryFilters(rows.filter(r=>r.amount===50),accounts).types,['expense']);
console.log('diary dynamic filter options tests passed');
