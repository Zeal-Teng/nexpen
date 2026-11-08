import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/folio-redesign.css',import.meta.url),'utf8');
test('only populated investment categories render cards',()=>{
 assert.match(app,/const populatedInvestmentOverview=investmentOverview\.filter/);
 assert.match(app,/item\.id==='stocks'\?stocks\.length>0:item\.count>0/);
 assert.match(app,/populatedInvestmentOverview\.map\(item=>/);
 assert.match(app,/String\(populatedInvestmentOverview\.length\)\.padStart\(2,"0"\)/);
});
test('net worth plot has zero padding override',()=>{
 assert.match(css,/networth-trend-plot\{padding:0!important;\}/);
});
