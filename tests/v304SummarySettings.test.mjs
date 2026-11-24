import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=n=>fs.readFileSync(new URL(`../src/${n}`,import.meta.url),'utf8');
test('stock update details are not displayed in holdings view',()=>{
 assert.doesNotMatch(read('StockPerformanceView.jsx'),/stock-quote-status/);
 assert.match(read('StockPerformanceView.jsx'),/onClick=\{onRefresh\}/);
});
test('second-tier stock summaries use rounded summary formatter',()=>{
 const source=read('StockPerformanceView.jsx');
 assert.match(source,/amount=\{allPriced\?summaryMoney\(stockVal\)/);
 assert.match(source,/profit=\{allPriced\?summaryResult\(stockProfit\)/);
 assert.match(source,/amount=\{summaryMoney\(totalSaleProceeds\)\} profit=\{summaryResult\(sumRealized\)\}/);
});
test('second tier other investments format primary converted amounts to integer',()=>{
 const source=read('InvestmentProducts.jsx');
 assert.match(source,/const inPrimary=v=>[\s\S]*?maximumFractionDigits:0/);
});
test('settings has version and update after password settings',()=>{
 const source=read('App.jsx');
 assert.ok(source.indexOf('<AppPasswordSettings hasPassword=')<source.indexOf('className="glass panel pwa-version-settings"'));
});
