import React from 'react';
import {ArrowLeft, ChevronRight, TrendingUp, TrendingDown, Coins} from 'lucide-react';

function percent(value){return Number.isFinite(value)?`${value>=0?'+':''}${value.toFixed(2)}%`:'—';}
function resultText(amount,fmt){return `${amount>=0?'+':'−'}${fmt(Math.abs(amount))}`;}

export default function StockPerformanceView({groups,holdings,quotes,fmt,fmtUnit,fmtTradeNative,language,selectedSymbol,onSelect,onEdit,onBack,baseAvailable,convert,nativeStockCurrency,quoteLoading,onRefresh,RefreshIcon}){
  const tr=(tw,en)=>language==='en'?en:tw;
  const active=groups.find(g=>g.symbol===selectedSymbol);
  const currentHoldings=holdings.map(h=>({...h,details:groups.find(g=>g.symbol===h.symbol)}));
  const sold=groups.filter(g=>g.soldShares>0).sort((a,b)=>String(b.lastSaleDate).localeCompare(String(a.lastSaleDate)));
  const other=groups.filter(g=>g.soldShares===0&&!currentHoldings.some(h=>h.symbol===g.symbol));
  const sumBasis=sold.reduce((s,g)=>s+g.realizedBasis,0);
  const sumRealized=sold.reduce((s,g)=>s+g.realized,0);
  const known=currentHoldings.filter(h=>Number(quotes[h.symbol]?.price)>0);
  const allPriced=known.length===currentHoldings.length;
  const stockCost=currentHoldings.reduce((s,h)=>s+h.cost,0);
  const stockVal=known.reduce((s,h)=>s+h.shares*Number(quotes[h.symbol].price),0);
  const stockProfit=stockVal-stockCost;
  const stockPct=stockCost>0?stockProfit/stockCost*100:null;
  const money=(n)=>baseAvailable?fmt(n):tr('匯率尚未取得','Exchange rate unavailable');
  const result=(n)=>baseAvailable?resultText(n,fmt):'—';
  const showMoney = (n)=>money(n);
  const rate=(g)=>g.realizedBasis>0?percent(g.realizedPercent):'—';
  if(active){
    const holding=currentHoldings.find(h=>h.symbol===active.symbol);
    const quote=quotes[active.symbol];
    const priced=holding&&Number(quote?.price)>0;
    const unrealized=priced?holding.shares*Number(quote.price)-holding.cost:null;
    return <section className="stock-detail-view">
      <button type="button" className="stock-back" onClick={onBack}><ArrowLeft size={18}/> {tr('返回股票','Back to stocks')}</button>
      <div className="stock-detail-header"><div><h2>{active.symbol}{active.securityName?` · ${active.securityName}`:''}</h2><small>{holding?`${holding.shares.toLocaleString('zh-TW')} 股 · ${tr('目前持有','Holding')}`:tr('已清倉','Closed position')}</small></div></div>
      <div className="stock-detail-metrics">
        {holding&&<div><small>{tr('未實現損益','Unrealized P/L')}</small><strong className={unrealized===null?'':unrealized>=0?'income':'expense'}>{unrealized===null?'—':result(unrealized)}</strong><span className={unrealized===null?'':unrealized>=0?'income':'expense'}>{unrealized===null?'待取得收盤價':percent(holding.cost>0?unrealized/holding.cost*100:null)}</span></div>}
        <div><small>{tr('已實現買賣損益','Realized trading P/L')}</small><strong className={active.realized>=0?'income':'expense'}>{result(active.realized)}</strong><span className={active.realized>=0?'income':'expense'}>{rate(active)}</span></div>
        {active.dividends!==0&&<div><small>{tr('累計現金股利','Cash dividends')}</small><strong>{showMoney(active.dividends)}</strong><span>{tr('未計入買賣價差','Separate from trading P/L')}</span></div>}
      </div>
      {active.issues.length>0&&<p className="stock-performance-warning">{tr('部分歷史賣出紀錄缺少足額買進資料，相關損益不會被推估。','Some older sales lack sufficient purchase history and were excluded.')} {active.issues.length} {tr('筆','records')}</p>}
      <section className="glass panel stock-trade-detail-list"><h3>{tr('買賣與股利紀錄','Trade and dividend history')}</h3>
        {active.transactions.map(x=><button type="button" className="stock-detail-trade" key={x.id} onClick={()=>onEdit(x)}>
          <div className={'transaction-icon '+(x.action==='dividend'?'income':x.action==='sell'?'income':'transfer')}>{x.action==='dividend'?<Coins size={18}/>:x.action==='sell'?<TrendingDown size={18}/>:<TrendingUp size={18}/>}</div>
          <div className="row-main"><b>{x.action==='buy'?tr('買進','Buy'):x.action==='sell'?tr('賣出','Sell'):tr('現金股利','Dividend')}</b><small>{x.date}{x.action==='dividend'?'':` · ${Number(x.shares).toLocaleString()} 股 × ${fmtUnit(x.price)}`}{x.action==='dividend'&&nativeStockCurrency?` · ${nativeStockCurrency}`:''}</small>{x.action==='sell'&&x.matchedBuy&&<small>沖銷 {x.matchedBuy.date} 買進 · {x.matchedBuy.price.toLocaleString('zh-TW',{maximumFractionDigits:4})} 元</small>}{x.action==='sell'&&x.realized!==null&&<small className={x.realized>=0?'income':'expense'}>{tr('已實現','Realized')} {result(x.realized)}（{percent(x.returnPercent)}）</small>}</div>
          <div className="transaction-right"><strong>{x.action==='dividend'?fmtTradeNative(Number(x.amount)||0):resultText(x.action==='buy'?-Number(x.totalAmount):Number(x.totalAmount),fmtTradeNative)}</strong></div><ChevronRight size={16} className="faint"/>
        </button>)}
      </section>
    </section>;
  }
  return <>
    <div className="stock-summary-v48">
      <div className="stock-summary-pair"><div className="stock-summary-item"><small>{tr('持有成本','Cost basis')}</small><strong>{money(stockCost)}</strong></div><div className="stock-summary-item"><small>{tr('估算市值','Market value')}</small><strong>{allPriced?money(stockVal):tr('部分未取得','Partially unavailable')}</strong></div></div>
      <div className="stock-summary-profit"><small>{tr('未實現損益','Unrealized P/L')}</small><div className="stock-pnl-result"><strong className={stockProfit>=0?'income':'expense'}>{allPriced?result(stockProfit):tr('待取得報價','Awaiting quotes')}</strong>{allPriced&&<span className={stockProfit>=0?'income':'expense'}>{percent(stockPct)}</span>}</div></div>
    </div>
    <p className="hint stock-price-explain">{tr('市值依最後成功收盤價估算，買進成本已含手續費；未實現損益不含未來賣出費稅。','Market value is based on the latest stored closing prices; unrealized P/L excludes future selling costs and tax.')}</p>
    <section className="glass panel stock-performance-section"><div className="stock-holdings-heading"><h2>{tr('目前持股','Current holdings')}</h2><div className="stock-quote-inline"><small>{(()=>{const dates=currentHoldings.map(h=>quotes[h.symbol]?.date).filter(Boolean).sort();return dates.length?`${tr('最後更新','Last updated')} ${dates.at(-1)}`:tr('尚未更新','Not updated')})()}</small><button type="button" className="stock-refresh-inline" aria-label={tr('更新收盤價','Refresh prices')} disabled={quoteLoading} onClick={onRefresh}><RefreshIcon size={17} className={quoteLoading?'spinning':''}/></button></div></div>
      {currentHoldings.length?currentHoldings.map(h=>{const q=Number(quotes[h.symbol]?.price)||0;const profit=q>0?h.shares*q-h.cost:null;return <button type="button" className="list-row stock-performance-row" key={h.symbol} onClick={()=>onSelect(h.symbol)}><div className="transaction-icon income"><TrendingUp size={18}/></div><div className="row-main"><b>{h.symbol}{h.details?.securityName?` · ${h.details.securityName}`:''}</b><small>{h.shares.toLocaleString()} 股 · {tr('均價','Avg.')} {fmtUnit(h.cost/h.shares)}</small><small>{q>0?`${tr('參考收盤','Close')} ${fmtUnit(q)}`:tr('尚未取得最近收盤價','Closing price unavailable')}</small></div><div className="holding-right"><strong>{q>0?money(h.shares*q):'—'}</strong>{profit!==null&&<div className={'holding-pnl '+(profit>=0?'income':'expense')}><span className="holding-pnl-value">{result(profit)}</span><span className="holding-pnl-rate">{percent(h.cost>0?profit/h.cost*100:null)}</span></div>}</div><ChevronRight size={16} className="faint"/></button>;}):<p className="hint">{tr('沒有持股記錄','No current holdings')}</p>}
    </section>
    <section className="glass panel stock-performance-section"><div className="stock-realized-header"><h2>{tr('已實現交易','Realized trades')}</h2><small>{sold.length} {tr('檔','symbols')}</small></div>
      {sold.length?<><div className="stock-realized-total"><small>{tr('累計已實現買賣損益','Total realized trading P/L')}</small><div className="stock-pnl-result"><strong className={sumRealized>=0?'income':'expense'}>{result(sumRealized)}</strong><span className={sumRealized>=0?'income':'expense'}>{percent(sumBasis>0?sumRealized/sumBasis*100:null)}</span></div></div>
        {sold.map(g=><button type="button" className="list-row stock-performance-row" key={g.symbol} onClick={()=>onSelect(g.symbol)}><div className="transaction-icon transfer"><TrendingDown size={18}/></div><div className="row-main"><b>{g.symbol}{g.securityName?` · ${g.securityName}`:''}</b><small>{g.isClosed?tr('已清倉','Closed'):tr('部分賣出','Partially sold')} · {g.soldShares.toLocaleString()} 股</small><small>{tr('最近賣出','Last sale')} {g.lastSaleDate}</small></div><div className="holding-right"><strong className={g.realized>=0?'income':'expense'}>{result(g.realized)}</strong><small className={'holding-pnl-rate '+(g.realized>=0?'income':'expense')}>{rate(g)}</small></div><ChevronRight size={16} className="faint"/></button>)}
      </>:<p className="hint">{tr('尚未有賣出交易，賣出後會自動計算實際損益。','No sales yet. Realized P/L will appear after selling.')}</p>}
    </section>
    {other.length>0&&<section className="glass panel stock-performance-section"><h2>{tr('其他股票紀錄','Other stock records')}</h2>{other.map(g=><button type="button" className="list-row stock-performance-row" key={g.symbol} onClick={()=>onSelect(g.symbol)}><div className="transaction-icon income"><Coins size={18}/></div><div className="row-main"><b>{g.symbol}{g.securityName?` · ${g.securityName}`:''}</b><small>{g.transactions.length} {tr('筆紀錄','records')}</small></div><ChevronRight size={16} className="faint"/></button>)}</section>}
  </>;
}
