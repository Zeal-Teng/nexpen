import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../src/',import.meta.url);
const app=readFileSync(new URL('App.jsx',root),'utf8');
const assets=readFileSync(new URL('InvestmentAssets.jsx',root),'utf8');
const subsidy=readFileSync(new URL('trustSubsidy.js',root),'utf8');
test('v306 trust account labels use concise language',()=>{
 for(const label of ['資產類別','初始成本','初始股數','目前成本','補助比例（%）']) assert.ok(app.includes(label));
 for(const obsolete of ['投資資產類別','初始個人取得成本','初始持有股數','目前剩餘取得成本','公司補助']) assert.ok(!app.includes(obsolete));
});
test('v306 contribution amount label hides currency and subsidy text is concise',()=>{
 assert.ok(assets.includes("dialog==='contribution'?i18n('本次投入金額')"));
 assert.ok(assets.includes("dialog==='contribution'?'':`${active.currency}）`"));
 assert.ok(!assets.includes('公司補助'));
 assert.ok(!subsidy.includes('公司補助'));
});
