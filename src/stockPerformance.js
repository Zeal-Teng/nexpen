import {calculateLots} from './stockLots.js';
// Lot-aware realized basis for selected purchase batches. Legacy sales remain
// on moving-average allocation. No mutation or schema migration is required.
export function analyzeStockPerformance(stocks=[]){
  return calculateLots(stocks).groups;
}
