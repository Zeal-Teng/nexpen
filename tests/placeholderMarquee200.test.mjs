import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {t} from '../src/i18n.js';
const src=readFileSync(new URL('../src/MarqueeInput.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/folio-redesign.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
assert.match(src,/ResizeObserver/);
assert.match(src,/textWidth-width/);
assert.match(src,/!focus/);
assert.match(src,/onFocus=/);
assert.match(src,/onBlur=/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/nexpen-placeholder-marquee/);
assert.match(app,/<MarqueeInput placeholder=\{i18n\("搜尋備註、分類、金額"\)/);
for(const locale of ['en','ja','zh-CN']){
 assert.notEqual(t('選擇分類',locale),'選擇分類');
 assert.notEqual(t('編輯範本',locale),'編輯範本');
}
console.log('v200 marquee and localization checks: pass');
