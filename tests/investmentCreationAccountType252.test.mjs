import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const db=readFileSync(new URL('../src/db.js',import.meta.url),'utf8');
test('investment creation stays exclusively in the investment module',()=>{
 assert.match(source,/else\{open\('account',null,type\);\}/);
 assert.match(source,/setInvestmentCreate\(kind==='account'/);
 assert.match(source,/持股信託與投資保單請由投資頁新增/);
});
test('investment assets are independent from ordinary account type management',()=>{
 assert.match(source,/const ordinaryAccountTypes=types=>/);
 assert.match(source,/setAccountTypes\(ordinaryAccountTypes\(at\?\.value\)\)/);
 assert.match(source,/const groups=accountTypes\.filter\(t=>!isInvestmentAssetType\(t\.id\)/);
 assert.match(source,/investment-fixed-asset-type/);
 assert.doesNotMatch(source,/value:\[\.\.\.list,defaultAccountTypes\.find/);
});
test('unused ordinary account types can be deleted without deleting linked investments',()=>{
 assert.match(source,/const refs=accountTypeRefs\(type\.id,allAccounts\)/);
 assert.match(source,/list\.length<=1/);
 assert.doesNotMatch(source,/if\(type\.id!=='brokerage'\)throw/);
});
test('legacy investment type settings are cleaned without touching financial accounts or valuations',()=>{
 assert.match(db,/const cleaned=typeSetting\.value\.filter\(t=>t\.id!=='trust'&&t\.id!=='policy'\)/);
 assert.match(db,/await db\.settings\.put\(\{key:'accountTypes',value:cleaned\.length\?/);
 assert.match(db,/ensureInvestmentSchema/);
 assert.match(db,/db\.version\(7\)/);
 assert.doesNotMatch(db,/deleteDatabase\(/);
});
