import assert from 'node:assert/strict';
import {t,setLocale,locales} from '../src/i18n.js';
for(const lang of locales){setLocale(lang);assert.equal(typeof t('交易日期'),'string');assert.ok(t('交易日期').length);assert.equal(t('NEXPEN'),'NEXPEN');}
assert.equal(t('交易日期','en'),'Transaction date');
assert.equal(t('交易日期','ja'),'取引日');
assert.equal(t('交易日期','zh-CN'),'交易日期');
assert.equal(t('我的自訂專案','en'),'我的自訂專案');
console.log('NEXPEN localization: basic assertions passed');
