import assert from 'node:assert/strict';
import {defaultCategories} from '../src/categoryPresets.js';
import {setLocale,t} from '../src/i18n.js';
const meals=defaultCategories.expense['餐飲美食'];
assert.equal(meals[meals.indexOf('晚餐')+1],'宵夜');
assert.equal(meals.filter(s=>s==='宵夜').length,1);
const labels=[...new Set(Object.values(defaultCategories).flatMap(groups=>Object.entries(groups).flatMap(([main,subs])=>[main,...subs])))];
for(const locale of ['en','ja','zh-CN']){
 setLocale(locale);
 for(const category of labels){
  const translated=t(category);
  assert(translated&&typeof translated==='string',`${locale}: ${category}`);
  // Japanese and Chinese translations may intentionally match Traditional Chinese glyphs.
 }
}
setLocale('en');assert.equal(t('宵夜'),'Late-night snack');
setLocale('zh-TW');assert.equal(t('宵夜'),'宵夜');
console.log('NEXPEN category language coverage tests passed');
