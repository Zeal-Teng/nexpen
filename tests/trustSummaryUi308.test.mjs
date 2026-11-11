import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const assets=fs.readFileSync(new URL('../src/InvestmentAssets.jsx',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
test('trust and investment overview use one shared TWD portfolio aggregation',()=>{
 assert.match(assets,/summarizeTrustPortfolio\(items,flows,quotes\)/);
 assert.match(app,/summarizeTrustPortfolio\(assets,investmentFlows,quotes\)/);
});
test('investment stage 2 profit uses main-currency converted summary once',()=>{
 assert.match(assets,/summaryCostForPnl/);
 assert.match(assets,/summaryPartial/);
});
