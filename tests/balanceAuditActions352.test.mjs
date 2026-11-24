import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
test('balance adjustment rows expose edit and delete buttons',()=>{
 assert.match(source,/diary-balance-audit-actions/);
 assert.match(source,/onClick=\{editDiaryRow\} aria-label="編輯餘額盤點紀錄"/);
 assert.match(source,/onClick=\{deleteDiaryRow\} aria-label="刪除餘額盤點紀錄"/);
});
test('existing adjustment editor offers delete via the same records table',()=>{
 assert.match(source,/\['transaction','account','stock','recurring','balanceAudit'\]\.includes\(dialog\)/);
 assert.match(source,/balanceAudit:'records'/);
 assert.match(source,/previous\?liveRecords\.filter\(r=>r\.id!==previous\.id\):liveRecords/);
});
