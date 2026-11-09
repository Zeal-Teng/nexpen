import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/InvestmentProducts.jsx',import.meta.url),'utf8');
test('savings insurance has no annual projection editing or viewing UI',()=>{
  for(const label of ['保單年度試算','年度解約金試算','批次貼上年度試算','新增年度試算','savings-projection-edit-row','savings-policy-scroll'])assert.equal(src.includes(label),false,label);
  assert.match(src,/保單現值提醒/);
  assert.match(src,/估值歷史/);
  assert.match(src,/savings-detail-history/);
});
test('investment amount and fee captions omit currency when matching primary',()=>{
  assert.match(src,/const currencySuffix=code=>code&&code!==primaryCurrency/);
  assert.match(src,/實際領回總額/);
  assert.match(src,/實收給付/);
  assert.match(src,/實際領回總額'[\s\S]*?\}\{currencySuffix\(currencyLabel\)\}/);
  assert.match(src,/手續費\{currencySuffix\(cash\?\.currency\)\}/);
  assert.doesNotMatch(src,/實收給付（TWD）|實際領回總額（TWD）|手續費（TWD）/);
});
