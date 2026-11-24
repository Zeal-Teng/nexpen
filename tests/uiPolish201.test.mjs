import assert from 'node:assert/strict';
import fs from 'node:fs';
import {t} from '../src/i18n.js';
const app=fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/folio-redesign.css',import.meta.url),'utf8');
for(const [key,en,ja,zhCn] of [
  ['定期','Recurring','定期','定期'],
  ['分類','Categories','カテゴリ','分类'],
  ['本機資料管理','Data management','端末内データ管理','本机数据管理'],
  ['個人財務','PERSONAL FINANCE','個人財務','个人财务'],
  ['你的金錢，你的空間','YOUR MONEY, YOUR SPACE','あなたのお金、あなたの空間','你的金钱，你的空间'],
]){
  assert.equal(t(key,'en'),en,key+' en');assert.equal(t(key,'ja'),ja,key+' ja');assert.equal(t(key,'zh-CN'),zhCn,key+' zh-CN');
}
assert.ok(app.includes('side-caption">{i18n("個人財務")}'));
assert.ok(app.includes('eyebrow">{i18n("你的金錢，你的空間")}'));
assert.match(css,/v201 — Diary ListView is borderless/);
assert.match(css,/\.diary-swipe-container\s*\{\s*border-radius:0!important;/);
console.log('v201 UI regression PASS');
