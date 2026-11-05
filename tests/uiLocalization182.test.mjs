import assert from 'node:assert/strict';
import fs from 'node:fs';
import {t} from '../src/i18n.js';
const app=fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const picker=fs.readFileSync(new URL('../src/NativeDatePicker.jsx',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/folio-redesign.css',import.meta.url),'utf8');
assert.match(picker,/value\.slice\(0,7\)/);
assert.match(picker,/value\.slice\(0,10\)/);
assert.doesNotMatch(picker,/replaceAll\('-', '\/'\)|replace\('-', '\/'\)/);
assert.match(app,/weekdayLabels\[language\]/);
assert.match(app,/weekdayFullLabels\[language\]/);
assert.match(app,/is-weekend/);
assert.match(css,/week-day\.is-weekend/);
assert.match(app,/\{i18n\(item\.title\)\}/);
assert.match(app,/\{i18n\(detail\)\}/);
assert.match(app,/updateFabPosition\(value\)\}\>\{tr\(label\)\}/);
for (const locale of ['en','ja','zh-CN']) {
 for(const label of ['左側','右側','股票','持股信託','投資保單','投資總覽','估算現值','股票持股、買賣與股利','持股信託與追加投入','投資保單與現值紀錄','投資分類與績效','點選類別查看資產及交易紀錄']){
  assert.ok(typeof t(label,locale)==='string' && t(label,locale).length>0,`${locale} missing ${label}`);
  if (locale==='en') assert.notEqual(t(label,locale),label,`${locale} untranslated ${label}`);
 }
}
console.log('v182 UI formatting and localization tests passed');
