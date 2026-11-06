import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const css = readFileSync(new URL('../src/folio-redesign.css', import.meta.url),'utf8');
const jsx = readFileSync(new URL('../src/NetWorthBreakdown.jsx', import.meta.url),'utf8');
test('net worth cards keep counts inside the left title block',()=>{
 assert.match(jsx,/className="investment-reference-copy"[\s\S]*?<small>\{data\.assets\.length\}/);
 assert.match(jsx,/<small>\{data\.liabilities\.length\}/);
 const section = css.split('/* v232 — Net worth asset/debt stack: restore v225 count placement.')[1];
 assert.ok(section);
 assert.match(section,/\.investment-reference-copy\s*\{[\s\S]*?flex-direction:column!important/);
 assert.match(section,/\.investment-reference-copy > small\s*\{[\s\S]*?align-self:flex-start!important/);
 assert.match(section,/\.investment-reference-amount\s*\{[\s\S]*?grid-row:auto!important/);
});
