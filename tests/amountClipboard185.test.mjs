import assert from 'node:assert/strict';
import {normalizePastedAmount} from '../src/amountClipboard.js';
assert.equal(normalizePastedAmount(' 1,234.50 '),'1234.50');
assert.equal(normalizePastedAmount(' NT$ 12,345 '),'12345');
assert.equal(normalizePastedAmount('5 × 7'),'5*7');
assert.equal(normalizePastedAmount('−400'),'-400');
assert.throws(()=>normalizePastedAmount('abc'));
assert.throws(()=>normalizePastedAmount('1;alert(1)'));
console.log('Amount clipboard normalization passed');
