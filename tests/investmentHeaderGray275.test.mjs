import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=(file)=>fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
const app=source('App.jsx');
const products=source('InvestmentProducts.jsx');
const assets=source('InvestmentAssets.jsx');
const stocks=source('StockPerformanceView.jsx');
const picker=source('InvestmentCategoryColorPicker.jsx');
const css=source('folio-redesign.css');
test('category swatch is a circle in sheet-header actions instead of form body',()=>{
 assert.match(picker,/iconOnly=false/);
 assert.match(picker,/circle-button investment-category-color-circle/);
 assert.match(products,/<header><h3>[\s\S]*?<div className="sheet-head-actions">\{dialog==='product'&&<InvestmentCategoryColorPicker iconOnly/);
 assert.match(app,/className="sheet-head-actions">[\s\S]*?<InvestmentCategoryColorPicker iconOnly/);
 assert.doesNotMatch(products,/<InvestmentCategoryColorPicker type=\{type\}/);
});
test('realized second level uses gray card in every investment category',()=>{
 assert.match(stocks,/<InvestmentStackCard accent="gray" title=\{tr\("已實現交易"/);
 assert.match(assets,/<InvestmentStackCard accent="gray" title=\{i18n\('已實現交易'\)/);
 assert.match(products,/<InvestmentStackCard title="已實現交易" accent="gray"/);
 assert.match(css,/investment-tier-card\.tier-gray[\s\S]*?--tier-color:#969da7!important/);
});
test('primary currency is omitted from investment display amounts only',()=>{
 assert.match(products,/const showFigure=\(n,code='TWD'\)=>figure\(n,code===primaryCurrency\?'':code\)/);
 assert.match(assets,/const displayMoney=\(v,c\)=>formatMoneyDisplay\(v,\{currency:c,primaryCurrency\}\)/);
 assert.match(products,/const figure=\(n,code='TWD'\)=>moneySymbol\(/);
});
