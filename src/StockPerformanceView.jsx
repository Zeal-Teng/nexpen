import {t as i18n} from './i18n.js';
import React from 'react';
import {InvestmentStack,InvestmentStackCard,InvestmentStackAsset} from './InvestmentStack.jsx';
import {ArrowLeft, ChevronRight, TrendingUp, TrendingDown, Coins} from 'lucide-react';

function percent(value){return Number.isFinite(value)?`${value>=0?'+':''}${value.toFixed(2)}%`:'—';}
function resultText(amount,fmt){return `${amount>=0?'+':'−'}${fmt(Math.abs(amount))}`;}

export default function StockPerformanceView({groups,holdings,quotes,fmt,fmtUnit,fmtTradeNative,language,selectedSymbol,onSelect,onEdit,onBack,baseAvailable,convert,nativeStockCurrency,quoteLoading,onRefresh,RefreshIcon}){
  const tr=(tw,en)=>{const value=i18n(tw,language);return language==='en'&&value===tw?en:value;};
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
  const toneClass=(n)=>n===null||n===undefined||Number.isNaN(Number(n))?'':Number(n)>=0?'income':'expense';
  if(active){
    const holding=currentHoldings.find(h=>h.symbol===active.symbol);
    const quote=quotes[active.symbol];
    const priced=holding&&Number(quote?.price)>0;
    const unrealized=priced?holding.shares*Number(quote.price)-holding.cost:null;
    return <section className="stock-detail-view">
      <button type="button" className="stock-back investment-nav-back" onClick={onBack}><ArrowLeft size={18}/> {tr('返回股票','Back to stocks')}</button>
      <InvestmentStack className="investment-third-level"><InvestmentStackCard accent="lavender" title={active.symbol+ (active.securityName?` · ${active.securityName}`:"")} summary={tr("個別持股績效","Security performance")} amount={unrealized===null?"—":result(unrealized)}><div className="investment-stage-hero investment-deep-hero investment-stock-deep-hero">
       <div className="investment-stage-kicker">NEXPEN · {tr('個別持股績效','SECURITY PERFORMANCE')}</div>
       <div className="stock-detail-header"><div><h2>{active.symbol}{active.securityName?` · ${active.securityName}`:''}</h2><small>{holding?`${holding.shares.toLocaleString('zh-TW')} 股 · ${tr('目前持有','Holding')}`:tr('已清倉','Closed position')}</small></div></div>
       <div className="stock-detail-metrics">
        {holding&&<div><small>{tr('未實現損益','Unrealized P/L')}</small><strong className={unrealized===null?'':unrealized>=0?'income':'expense'}>{unrealized===null?'—':result(unrealized)}</strong><span className={unrealized===null?'':unrealized>=0?'income':'expense'}>{unrealized===null?i18n("待取得收盤價"):percent(holding.cost>0?unrealized/holding.cost*100:null)}</span></div>}
        <div><small>{tr('已實現買賣損益','Realized trading P/L')}</small><strong className={active.realized>=0?'income':'expense'}>{result(active.realized)}</strong><span className={active.realized>=0?'income':'expense'}>{rate(active)}</span></div>
        {active.dividends!==0&&<div><small>{tr('累計現金股利','Cash dividends')}</small><strong>{showMoney(active.dividends)}</strong><span>{tr('未計入買賣價差','Separate from trading P/L')}</span></div>}
       </div>
      </div>
      </InvestmentStackCard>
      {active.issues.length>0&&<p className="stock-performance-warning">{tr('部分歷史賣出紀錄缺少足額買進資料，相關損益不會被推估。','Some older sales lack sufficient purchase history and were excluded.')} {active.issues.length} {tr('筆','records')}</p>}
      <InvestmentStackCard accent="mint" title={tr("買賣與股利紀錄","Trade and dividend history")} summary={`${active.transactions.length} ${tr("筆紀錄","records")}`} amount={null}><section className="glass panel stock-trade-detail-list investment-stage-history"><h3>{tr('買賣與股利紀錄','Trade and dividend history')}</h3>
        {active.transactions.map(x=>{const cashTone=x.action==='buy'?'expense':'income';const cashAmount=x.action==='dividend'?fmtTradeNative(Number(x.amount)||0):resultText(x.action==='buy'?-Number(x.totalAmount):Number(x.totalAmount),fmtTradeNative);return <button type="button" className="stock-detail-trade" key={x.id} onClick={()=>onEdit(x)}>
          <div className={'transaction-icon '+(x.action==='dividend'?'income':x.action==='sell'?'income':'transfer')}>{x.action==='dividend'?<Coins size={18}/>:x.action==='sell'?<TrendingDown size={18}/>:<TrendingUp size={18}/>}</div>
          <div className="row-main stock-detail-trade-copy"><div className="stock-detail-trade-header"><b>{x.action==='buy'?tr('買進','Buy'):x.action==='sell'?tr('賣出','Sell'):tr('現金股利','Dividend')}</b><small>{x.date}</small></div><div className="stock-detail-trade-meta">{x.action==='dividend'?<small>{nativeStockCurrency?nativeStockCurrency:tr('現金股利','Dividend')}</small>:<small>{Number(x.shares).toLocaleString()} 股 × {fmtUnit(x.price)}</small>}{x.action==='sell'&&x.matchedBuy&&<small>{i18n("沖銷")} {x.matchedBuy.date} {i18n("買進 ·")} {fmtUnit(x.matchedBuy.price).replace(/^TWD /,'')} {i18n("元")}</small>}</div></div>
          <div className="stock-detail-trade-side"><div className="transaction-right"><strong className={cashTone}>{cashAmount}</strong>{x.action==='sell'&&x.realized!==null&&<small className={'stock-trade-inline-result '+toneClass(x.realized)}>{tr('已實現','Realized')} {result(x.realized)} · {percent(x.returnPercent)}</small>}</div><ChevronRight size={16} className="faint"/></div>
        </button>})}
      </section></InvestmentStackCard></InvestmentStack>
    </section>;
  }
  return <>
    <section className="investment-stage-hero investment-category-hero investment-stock-category-hero investment-unified-summary" aria-label={tr('股票績效總覽','Stock performance summary')}>
      <div className="investment-stage-heading"><div><span className="investment-stage-kicker">NEXPEN · STOCKS</span><h2>{tr('股票投資','Stock investments')}</h2></div><span className="investment-stage-count">{currentHoldings.length} {tr('檔持股','holdings')}</span></div>
      <div className="stock-summary-v48 investment-stage-summary">
      <div className="stock-summary-pair"><div className="stock-summary-item"><small>{tr('持有成本','Cost basis')}</small><strong>{money(stockCost)}</strong></div><div className="stock-summary-item"><small>{tr('估算市值','Market value')}</small><strong>{allPriced?money(stockVal):tr('部分未取得','Partially unavailable')}</strong></div></div>
      <div className="stock-summary-profit"><small>{tr('未實現損益','Unrealized P/L')}</small><div className="stock-pnl-result"><strong className={stockProfit>=0?'income':'expense'}>{allPriced?result(stockProfit):tr('待取得報價','Awaiting quotes')}</strong>{allPriced&&<span className={stockProfit>=0?'income':'expense'}>{percent(stockPct)}</span>}</div></div>
      </div>
    </section>
    <p className="hint stock-price-explain">{tr('市值依最後成功收盤價估算，買進成本已含手續費；未實現損益不含未來賣出費稅。','Market value is based on the latest stored closing prices; unrealized P/L excludes future selling costs and tax.')}</p>
    <InvestmentStack className="investment-second-level"><InvestmentStackCard accent="lavender" title={tr("目前持股","Current holdings")} summary={`${currentHoldings.length} ${tr("檔持股","holdings")}`} amount={allPriced?money(stockVal):"—"}><section className="glass panel stock-performance-section investment-stage-list"><div className="stock-holdings-heading"><h2>{tr('目前持股','Current holdings')}</h2><div className="stock-quote-inline"><small>{(()=>{const dates=currentHoldings.map(h=>quotes[h.symbol]?.date).filter(Boolean).sort();return dates.length?`${tr('最後更新','Last updated')} ${dates.at(-1)}`:tr('尚未更新','Not updated')})()}</small><button type="button" className="stock-refresh-inline" aria-label={tr('更新收盤價','Refresh prices')} disabled={quoteLoading} onClick={onRefresh}><RefreshIcon size={17} className={quoteLoading?'spinning':''}/></button></div></div>
      <div className="investment-tier-stack investment-asset-substack">{currentHoldings.length?currentHoldings.map(h=>{const q=Number(quotes[h.symbol]?.price)||0;const profit=q>0?h.shares*q-h.cost:null;return <InvestmentStackAsset key={h.symbol} accent="lavender" title={`${h.symbol}${h.details?.securityName?` · ${h.details.securityName}`:''}`} subtitle={`${h.shares.toLocaleString()} ${i18n("股 ·")} ${tr("均價","Avg.")} ${fmtUnit(h.cost/h.shares)}`} amount={q>0?money(h.shares*q):"—"} profit={profit!==null?result(profit):"—"} rate={profit!==null?percent(h.cost>0?profit/h.cost*100:null):"—"} profitTone={toneClass(profit)} onOpen={()=>onSelect(h.symbol)}><p className="hint">{q>0?`${tr("參考收盤","Close")} ${fmtUnit(q)}`:tr("尚未取得最近收盤價","Closing price unavailable")}</p></InvestmentStackAsset>;}):<p className="hint">{tr('沒有持股記錄','No current holdings')}</p>}</div>
    </section></InvestmentStackCard>
    <InvestmentStackCard accent="coral" title={tr("已實現交易","Realized trades")} summary={`${sold.length} ${tr("檔","symbols")}`} amount={result(sumRealized)}><section className="glass panel stock-performance-section investment-stage-list"><div className="stock-realized-header"><h2>{tr('已實現交易','Realized trades')}</h2><small>{sold.length} {tr('檔','symbols')}</small></div>
      {sold.length?<><div className="stock-realized-total"><small>{tr('累計已實現買賣損益','Total realized trading P/L')}</small><div className="stock-pnl-result"><strong className={sumRealized>=0?'income':'expense'}>{result(sumRealized)}</strong><span className={sumRealized>=0?'income':'expense'}>{percent(sumBasis>0?sumRealized/sumBasis*100:null)}</span></div></div>
        <div className="investment-tier-stack investment-asset-substack">{sold.map(g=><InvestmentStackAsset key={g.symbol} accent="coral" title={`${g.symbol}${g.securityName?` · ${g.securityName}`:''}`} subtitle={`${g.isClosed?tr("已清倉","Closed"):tr("部分賣出","Partially sold")} · ${g.soldShares.toLocaleString()} ${i18n("股")}`} amount={result(g.realized)} profit={result(g.realized)} rate={rate(g)} profitTone={toneClass(g.realized)} onOpen={()=>onSelect(g.symbol)}><p className="hint">{tr("最近賣出","Last sale")} {g.lastSaleDate}</p></InvestmentStackAsset>)}</div>
      </>:<p className="hint">{tr('尚未有賣出交易，賣出後會自動計算實際損益。','No sales yet. Realized P/L will appear after selling.')}</p>}
    </section></InvestmentStackCard>
    {other.length>0&&<InvestmentStackCard accent="mint" title={tr('其他股票紀錄','Other stock records')} summary={`${other.length} ${tr('檔','symbols')}`} amount={null}>
      <section className="glass panel stock-performance-section investment-stage-list">
        <h2>{tr('其他股票紀錄','Other stock records')}</h2>
        <div className="investment-tier-stack investment-asset-substack">
          {other.map(g=><InvestmentStackAsset
            key={g.symbol}
            accent="mint"
            title={`${g.symbol}${g.securityName?` · ${g.securityName}`:''}`}
            subtitle={`${g.transactions.length} ${tr('筆紀錄','records')}`}
            amount={null}
            onOpen={()=>onSelect(g.symbol)}
          />)}
        </div>
      </section>
    </InvestmentStackCard>}
    </InvestmentStack>
  </>;
}
