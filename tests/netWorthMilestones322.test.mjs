import test from 'node:test';
import assert from 'node:assert/strict';
import {dateGapDays,normalizeGoalMilestones} from '../src/goalMilestones.js';
test('calendar-day difference is correct across years and leap day',()=>{
 assert.equal(dateGapDays('2026-11-12','2028-06-15'),581);
 assert.equal(dateGapDays('2028-02-28','2028-03-01'),2);
 assert.equal(dateGapDays('2026-11-12','2026-11-12'),0);
 assert.equal(dateGapDays('2026-02-30','2026-03-01'),null);
});
test('milestones remain ordered by increasing amount and date',()=>{
 const input=[{amountTwd:1e7,achievedDate:'2026-11-12'},{amountTwd:2e7,achievedDate:'2028-06-15'}];
 assert.deepEqual(normalizeGoalMilestones(input),input);
 assert.equal(normalizeGoalMilestones([...input,{amountTwd:1e7,achievedDate:'2028-07-01'}]).length,2);
 assert.equal(normalizeGoalMilestones([...input,{amountTwd:3e7,achievedDate:'2020-01-01'}]).length,2);
});
