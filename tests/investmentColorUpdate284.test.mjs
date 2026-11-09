import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(name)=>readFileSync(new URL(`../src/${name}`,import.meta.url),'utf8');
test('all second-level current holdings share the configured first-tier color',()=>{
 const app=source('App.jsx');
 const stack=source('InvestmentStack.jsx');
 const products=source('InvestmentProducts.jsx');
 const assets=source('InvestmentAssets.jsx');
 const stocks=source('StockPerformanceView.jsx');
 assert.match(stack,/color=null/);
 assert.match(stack,/\'--tier-color\':color/);
 assert.match(products,/color=\{categoryColor\(type,categoryColors\)\}/);
 assert.match(assets,/color=\{categoryColor\(type,categoryColors\)\}/);
 assert.match(stocks,/color=\{categoryColor\('stocks',categoryColors\)\}/);
 assert.match(app,/categoryColors=\{investmentCategoryColors\}/);
 const css=source('folio-redesign.css');
 assert.doesNotMatch(css,/investment-product-page\[data-investment-type="(?:fund|bond|savings|termDeposit)"\].*--tier-color:/);
 assert.match(css,/tier-gray[\s\S]*?--tier-color:#969da7!important/);
});
test('version settings are concise and manual update results auto-dismiss',()=>{
 const app=source('App.jsx');
 const updater=source('PwaUpdateManager.jsx');
 assert.doesNotMatch(app,/發現新版時會提示；下次開啟會自動更新/);
 assert.doesNotMatch(app,/從 GitHub Pages 檢查最新版/);
 assert.match(updater,/if\(!message\|\|available\)return/);
 assert.match(updater,/setTimeout\(\(\)=>setMessage\(''\),3500\)/);
});
