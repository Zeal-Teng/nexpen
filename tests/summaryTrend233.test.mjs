import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=name=>readFileSync(new URL(`../src/${name}`,import.meta.url),'utf8');
test('SummaryHero has only one primary amount without inline P/L result',()=>{
 const hero=src('SummaryHero.jsx');
 assert.doesNotMatch(hero,/investment-summary-inline-result|snapshot&&/);
 assert.match(hero,/summary-hero-value/);
 const app=src('App.jsx');
 assert.doesNotMatch(app,/snapshot=\{gain/);
 assert.match(app,/summary-hero-metrics/);
});
test('Net worth and investment summary share compact styles',()=>{
 const css=src('folio-redesign.css');
 assert.match(css,/\.summary-hero:is\(\.investment-dashboard-hero,\.networth-overview-hero\) \.summary-hero-trigger/);
 assert.doesNotMatch(css,/html \.app-shell \.investment-summary-inline-result/);
});
test('Trend header shows selected date without verbose description and number row does not repeat it',()=>{
 const trend=src('NetWorthTrend.jsx');
 assert.match(trend, /networth-trend-heading-date/);
 assert.match(trend, /<time dateTime=\{point\.date\}/);
 assert.doesNotMatch(trend, /<small>\{t\.desc\}<\/small>/);
 assert.doesNotMatch(trend, /<small>\{point\.date\}/);
});
