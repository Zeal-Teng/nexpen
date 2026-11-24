import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {investmentCashMovement} from '../src/investmentCashFlow.js';
import {investmentDiaryRows} from '../src/investmentDiary.js';
import {investmentProductPosition,validateProductTrade} from '../src/investmentProducts.js';
import {parseSavingsProjectionText} from '../src/savingsPolicy.js';

const product={id:'s1',name:'美富添喜',currency:'USD',type:'savings',price:151550.98};
const payment={id:'h1',assetId:'s1',kind:'contribution',historical:true,date:'2020-11-07',amount:20681.8,shares:20681.8,sourceAccount:'',redemptionFee:0};

test('historical savings premium preserves position and does not deduct bank twice',()=>{
 assert.equal(investmentCashMovement(payment),0);
 assert.equal(investmentProductPosition(product,[payment]).cost,20681.8);
 assert.equal(investmentDiaryRows([payment],[],[product]).length,0);
 assert.equal(validateProductTrade(product,[],payment,null),true);
});
test('live savings premium still requires source account',()=>{
 assert.throws(()=>validateProductTrade(product,[],{...payment,historical:false},null),/選擇資金帳戶/);
});
test('bulk projection import stores only estimates',()=>{
 const result=parseSavingsProjectionText('5\t101579.69\t100657.24\t103869.02\n10\t121099.76\t151550.98\t151561.37');
 assert.deepEqual(result.map(r=>r.year),[5,10]);
 assert.equal(result[1].endValue,151550.98);
 assert.throws(()=>parseSavingsProjectionText('5,100,200\n5,100,300'),/不重複/);
});
test('second and third tier use shared investment stack and ListView',()=>{
 const src=readFileSync(new URL('../src/InvestmentProducts.jsx',import.meta.url),'utf8');
 assert.match(src,/investment-second-level investment-asset-group-stack investment-product-stage-stack/);
 assert.match(src,/title="目前持有"/);
 assert.match(src,/title="已實現交易"/);
 assert.match(src,/investment-third-level investment-third-listview/);
 assert.match(src,/stock-detail-trade investment-history-button/);
});
