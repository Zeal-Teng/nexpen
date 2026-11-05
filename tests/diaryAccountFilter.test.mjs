import assert from 'node:assert/strict';
import {filterDiaryByAccount,matchesDiaryAccount} from '../src/diaryAccountFilter.js';
const accounts=[{id:'bank-1',name:'國泰世華'},{id:'ins-2',name:'新光人壽'},{id:'bank-3',name:'中國信託'}];
const records=[
 {type:'income',account:'bank-1',amount:200000},
 {type:'expense',account:'bank-1',amount:400},
 {type:'stock',account:'bank-3',amount:2000},
 {type:'transfer',fromAccount:'bank-1',toAccount:'bank-3',amount:100},
];
assert.deepEqual(filterDiaryByAccount(records,'ins-2',accounts),[],'No transactions from a different account');
assert.deepEqual(filterDiaryByAccount(records,'bank-1',accounts).map(r=>r.amount),[200000,400,100]);
assert.deepEqual(filterDiaryByAccount(records,'bank-3',accounts).map(r=>r.amount),[2000,100]);
assert.equal(matchesDiaryAccount({type:'expense',account:'bank-1',fromAccount:'ins-2'},'ins-2',accounts),false,'Ignore stale transfer fields on expense');
assert.equal(matchesDiaryAccount({type:'transfer',fromAccount:'bank-1',toAccount:'ins-2'},'ins-2',accounts),true);
assert.equal(matchesDiaryAccount(records[0],'removed-account',accounts),false);
assert.equal(filterDiaryByAccount(records,'all',accounts).length,4);
console.log('diaryAccountFilter tests passed');
