import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/db.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
test('native upgrade uses Dexie version 9 mapped to IndexedDB 90, never raw 9',()=>{
 assert.match(source,/db\.version\(9\)\.stores/);
 assert.match(source,/indexedDB\.open\(db\.name,90\)/);
 assert.doesNotMatch(source,/indexedDB\.open\(db\.name,7\)/);
});
test('repair creates missing investment stores and indexes while keeping existing data',()=>{
 assert.match(source,/native\.createObjectStore\(name/);
 assert.match(source,/request\.transaction\.objectStore\(name\)/);
 assert.match(source,/indexNames\.contains\(field\)/);
 assert.doesNotMatch(source.slice(source.indexOf('export async function ensureInvestmentSchema'),source.indexOf('export const today')),/\.deleteObjectStore\(|\.clear\(|\.deleteDatabase\(/);
});
test('repair runs before launching or reading investment records',()=>{
 assert.match(app,/ensureInvestmentSchema\(\)\.then\(/);
 assert.match(source,/await db\.open\(\)/);
});
