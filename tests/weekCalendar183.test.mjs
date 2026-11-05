import assert from 'node:assert/strict';
import {weekDatesFor} from '../src/weekCalendar.js';
assert.deepEqual(weekDatesFor('2026-11-05',0),['2026-11-01','2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07']);
assert.deepEqual(weekDatesFor('2026-11-05',1),['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08']);
assert.deepEqual(weekDatesFor('2026-01-01',1),['2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02','2026-01-03','2026-01-04']);
assert.deepEqual(weekDatesFor('2026-11-05',99),weekDatesFor('2026-11-05',0));
console.log('Week first-day tests passed');
