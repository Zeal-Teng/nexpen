import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const products=fs.readFileSync(new URL('../src/InvestmentProducts.jsx',import.meta.url),'utf8');
const colors=fs.readFileSync(new URL('../src/InvestmentCategoryColorPicker.jsx',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/folio-redesign.css',import.meta.url),'utf8');
test('color picker is available for all investment create/edit entry points',()=>{
 assert.match(app,/<InvestmentCategoryColorPicker type="stocks"/);
 assert.match(app,/<InvestmentCategoryColorPicker type=\{form\.type\}/);
 assert.match(products,/<InvestmentCategoryColorPicker type=\{type\}/);
});
test('category palette stores under settings, is restored, and colors first-level cards',()=>{
 assert.match(app,/db\.settings\.put\(\{key:'investmentCategoryColors'/);
 assert.match(app,/db\.settings\.get\('investmentCategoryColors'\)/);
 assert.match(app,/style=\{\{'--peek':categoryColor\(item\.id,investmentCategoryColors\)/);
 for(const type of ['stocks','trust','policy','fund','bond','savings','termDeposit'])assert.match(colors,new RegExp(`\\b${type}:'#`));
 assert.match(colors,/type="color"/);
});
test('investment second-level geometry changes from hexagon to rounded diamonds',()=>{
 const newRules=css.slice(css.lastIndexOf('v273 — Investment second-layer'));
 assert.match(newRules,/clip-path:none!important/);
 assert.match(newRules,/border-radius:22px!important/);
 assert.match(newRules,/rotate\(32deg\)/);
});
