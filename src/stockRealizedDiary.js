import {calculateLots} from './stockLots.js';

/**
 * Read-only diary/report projections for realized stock sale gains or losses.
 * These are NOT cash transfers and MUST NOT be inserted into db.records:
 * the actual net sale proceeds are already booked once by db.stocks.
 * Profit/loss uses the identical lot matching, fees and taxes as stock performance.
 */
export function stockRealizedDiaryRows(stocks=[]) {
  const {rows}=calculateLots(stocks);
  return stocks.flatMap(trade=>{
    if(trade.action!=='sell')return [];
    const result=rows.get(trade.id);
    if(!result || !Number.isFinite(result.realized) || Math.abs(result.realized)<1e-7)return [];
    const profit=result.realized>0;
    return [{
      id:`stock-realized:${trade.id}`,
      stockId:trade.id,
      isStockRealized:true,
      isVirtualDiaryRow:true,
      date:trade.date,
      account:trade.account,
      type:profit?'income':'expense',
      amount:Math.abs(result.realized),
      mainCategory:'投資損益',
      subCategory:profit?'股票獲利':'股票虧損',
      note:`${trade.symbol}${trade.securityName?`（${trade.securityName}）`:''} · ${profit?'已實現獲利':'已實現虧損'}`,
    }];
  });
}
