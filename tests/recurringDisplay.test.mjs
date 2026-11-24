import assert from 'node:assert/strict';
import {diaryTransactionTitle} from '../src/recurringDisplay.js';
assert.equal(diaryTransactionTitle({id:'recurring:abc:2026-11-05',recurringId:'abc',note:'定期交易：收入',mainCategory:'薪資所得',subCategory:'副業兼差'}),'副業兼差');
assert.equal(diaryTransactionTitle({id:'recurring:abc:2026-11-05',recurringId:'abc',note:'',mainCategory:'薪資所得',subCategory:'副業兼差'}),'副業兼差');
assert.equal(diaryTransactionTitle({id:'manual',note:'定期交易：收入',subCategory:'副業兼差'}),'定期交易：收入');
assert.equal(diaryTransactionTitle({id:'manual',note:'早餐',subCategory:'早餐'}),'早餐');
assert.equal(diaryTransactionTitle({id:'recurring:abc:2026-11-05',recurringId:'abc',note:'',mainCategory:'其他收入',subCategory:''}),'其他收入');
console.log('Recurring diary display tests passed');
