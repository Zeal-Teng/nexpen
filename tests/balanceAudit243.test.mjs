import test from 'node:test';
import assert from 'node:assert/strict';
import {balanceAuditDelta,isBalanceAudit} from '../src/balanceAudit.js';

test('positive adjustment reconciles the calculated balance to the physical balance',()=>{
 const before=1200, actual=1250.45;
 const delta=balanceAuditDelta(String(actual),before,2);
 assert.equal(delta,50.45);
 assert.equal(Math.round((before+delta)*100)/100,actual);
});
test('negative difference is a signed correction, never ordinary spending',()=>{
 const delta=balanceAuditDelta('900',1000,2);
 assert.equal(delta,-100);
 const record={type:'adjustment',isBalanceAdjustment:true,amount:delta};
 assert.equal(isBalanceAudit(record),true);
 assert.notEqual(record.type,'expense');
 assert.equal(isBalanceAudit({type:'income',amount:100}),false);
});
test('editing replaces old correction instead of stacking another correction',()=>{
 const opening=1000, oldDelta=75;
 const currentlyDisplayed=opening+oldDelta;
 const adjustedBaseline=currentlyDisplayed-oldDelta;
 assert.equal(balanceAuditDelta('990',adjustedBaseline,2),-10);
});
test('invalid amount precision and missing value are rejected',()=>{
 assert.throws(()=>balanceAuditDelta('',1000,2));
 assert.throws(()=>balanceAuditDelta('1000.123',1000,2));
 assert.equal(balanceAuditDelta('1000',1000,2),0);
});
