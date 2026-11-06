import {t as i18n} from './i18n.js';
import React from 'react';
import {InvestmentStack,InvestmentStackCard,InvestmentStackAsset,ClosingPrice} from './InvestmentStack.jsx';
import {ArrowLeft, ChevronRight} from 'lucide-react';

function percent(value){return Number.isFinite(value)?`${value>=0?'+':''}${value.toFixed(2)}%`:'—';}
function resultText(amount,fmt){return `${amount>=0?'+':'−'}${fmt(Math.abs(amount))}`;}

export default function StockPerformanceView({groups,holdings,quotes,fmt,fmtSummary=fmt,fmtUnit,fmtTradeNative,language,selectedSymbol,onSelect,onEdit,onBack,baseAvailable,convert,accounts=[],nativeStockCurrency,quoteLoading,onRefresh,RefreshIcon}){
  const tr=(tw,en)=>{const value=i18n(tw,language);return language==='en'&&value===tw?en:value;};
  const active=groups.find(g=>g.symbol===selectedSymbol);
  const accountNames=new Map(accounts.map(a=>[String(a.id),a.name]));
  const currentHoldings=holdings.map(h=>({...h,details:groups.find(g=>g.symbol===h.symbol)}));
  const sold=groups.filter(g=>g.soldShares>0).sort((a,b)=>String(b.lastSaleDate).localeCompare(String(a.lastSaleDate)));
  const other=groups.filter(g=>g.soldShares===0&&!currentHoldings.some(h=>h.symbol===g.symbol));
  const sumBasis=sold.reduce((s,g)=>s+g.realizedBasis,0);
  const sumRealized=sold.reduce((s,g)=>s+g.realized,0);
  const totalSaleProceeds=sold.reduce((sum,g)=>sum+(g.transactions||[]).filter(x=>x.action==='sell').reduce((n,x)=>n+(Number(x.totalAmount)||0),0),0);
  const known=currentHoldings.filter(h=>Number(quotes[h.symbol]?.price)>0);
  const allPriced=known.length===currentHoldings.length;
  const stockCost=currentHoldings.reduce((s,h)=>s+h.cost,0);
  const stockVal=known.reduce((s,h)=>s+h.shares*Number(quotes[h.symbol].price),0);
  const stockProfit=stockVal-stockCost;
  const stockPct=stockCost>0?stockProfit/stockCost*100:null;
  const money=(n)=>baseAvailable?fmt(n):tr('匯率尚未取得','Exchange rate unavailable');
  const summaryMoney=(n)=>baseAvailable?fmtSummary(n):tr('匯率尚未取得','Exchange rate unavailable');
  const summaryResult=(n)=>baseAvailable?resultText(n,fmtSummary):'—';
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
      <section className="investment-third-level investment-third-listview">
       <div className="investment-third-listview-heading"><h2>{tr('買賣與股利紀錄','Trade and dividend history')}</h2><small>{active.symbol}{active.securityName?` · ${active.securityName}`:''} · {active.transactions.length} {tr('筆紀錄','records')}</small></div>
       <div className="stock-trade-detail-list investment-stage-history investment-third-list-content">
        {active.transactions.map(x=>{
          const isBuy=x.action==='buy';
          const isSell=x.action==='sell';
          const cashTone=isBuy?'expense':'income';
          const cashAmount=x.action==='dividend'?fmtTradeNative(Number(x.amount)||0):resultText(isBuy?-Number(x.totalAmount):Number(x.totalAmount),fmtTradeNative);
          return <button type="button" className={'stock-detail-trade stock-history-entry stock-history-'+x.action} key={x.id} onClick={()=>onEdit(x)}>
            <span className="stock-history-content">
              <span className="stock-history-heading"><b>{isBuy?tr('買進','Buy'):isSell?tr('賣出','Sell'):tr('現金股利','Dividend')}</b><time dateTime={x.date}>{x.date}</time></span>
              <span className="stock-history-details">
                {x.action!=='dividend'&&<span>{Number(x.shares).toLocaleString('zh-TW')} {tr('股','shares')} × {fmtUnit(x.price)}</span>}
                {x.action==='dividend'&&nativeStockCurrency&&<span>{nativeStockCurrency}</span>}
                {isSell&&x.matchedBuy&&<span>{tr('沖銷','Matched buy')} {x.matchedBuy.date} · {tr('買進價','Buy price')} {fmtUnit(x.matchedBuy.price)}</span>}
                <span className="stock-history-account">{tr('帳戶','Account')}：{accountNames.get(String(x.account))||tr('未指定帳戶','Unassigned')}</span>
              </span>
              <span className="stock-history-financials">
                <span className="stock-history-financial">
                  <span className="stock-history-label">{isBuy?tr('買進支出','Purchase amount'):isSell?tr('賣出入帳','Sale proceeds'):tr('股利收入','Dividend income')}</span>
                  <strong className={cashTone}>{cashAmount}</strong>
                </span>
                {isSell&&x.realized!==null&&<span className="stock-history-financial stock-history-realized">
                  <span className="stock-history-label">{tr('已實現損益','Realized P/L')}</span>
                  <strong className={toneClass(x.realized)}>{result(x.realized)}</strong>
                  <small className={toneClass(x.realized)}>{percent(x.returnPercent)}</small>
                </span>}
              </span>
            </span>
            <ChevronRight size={17} className="stock-history-chevron" aria-hidden="true"/>
          </button>;
        })}
        {!active.transactions.length&&<p className="hint">{tr('尚無交易紀錄','No transactions yet')}</p>}
      </div></section>
    </section>;
  }
  return <>
    <section className="investment-stage-hero investment-category-hero investment-stock-category-hero investment-unified-summary" aria-label={tr('股票績效總覽','Stock performance summary')}>
      <div className="investment-stage-heading"><div><span className="investment-stage-kicker">NEXPEN · STOCKS</span><h2>{tr('股票投資','Stock investments')}</h2></div><span className="investment-stage-count">{currentHoldings.length} {tr('檔持股','holdings')}</span></div>
      <div className="stock-summary-v48 investment-stage-summary">
      <div className="stock-summary-pair"><div className="stock-summary-item"><small>{tr('持有成本','Cost basis')}</small><strong>{summaryMoney(stockCost)}</strong></div><div className="stock-summary-item"><small>{tr('估算市值','Market value')}</small><strong>{allPriced?summaryMoney(stockVal):tr('部分未取得','Partially unavailable')}</strong></div></div>
      <div className="stock-summary-profit"><small>{tr('未實現損益','Unrealized P/L')}</small><div className="stock-pnl-result investment-second-pnl-badges"><strong className={stockProfit>=0?'income':'expense'}>{allPriced?summaryResult(stockProfit):tr('待取得報價','Awaiting quotes')}</strong>{allPriced&&<span className={stockProfit>=0?'income':'expense'}>{percent(stockPct)}</span>}</div></div>
      </div>
    </section>
    <p className="hint stock-price-explain">{tr('市值依最後成功收盤價估算，買進成本已含手續費；未實現損益不含未來賣出費稅。','Market value is based on the latest stored closing prices; unrealized P/L excludes future selling costs and tax.')}</p>
    <InvestmentStack className="investment-second-level"><InvestmentStackCard accent="lavender" title={tr("目前持有","Current holdings")} summary={null} amount={allPriced?money(stockVal):"—"} profit={allPriced?result(stockProfit):"—"} rate={allPriced?percent(stockPct):"—"} profitTone={toneClass(allPriced?stockProfit:null)}><section className="glass panel stock-performance-section investment-stage-list"><div className="stock-holdings-heading"><div className="stock-quote-inline"><small>{(()=>{const dates=currentHoldings.map(h=>quotes[h.symbol]?.date).filter(Boolean).sort();return dates.length?`${tr('最後更新','Last updated')} ${dates.at(-1)}`:tr('尚未更新','Not updated')})()}</small><button type="button" className="stock-refresh-inline" aria-label={tr('更新收盤價','Refresh prices')} disabled={quoteLoading} onClick={onRefresh}><RefreshIcon size={17} className={quoteLoading?'spinning':''}/></button></div></div>
      <div className="investment-tier-stack investment-asset-substack">{currentHoldings.length?currentHoldings.map(h=>{const q=Number(quotes[h.symbol]?.price)||0;const profit=q>0?h.shares*q-h.cost:null;return <InvestmentStackAsset key={h.symbol} accent="lavender" stockLayout title={`${h.symbol}${h.details?.securityName?` · ${h.details.securityName}`:''}`} topRight={q>0?<ClosingPrice value={fmtUnit(q)} change={quotes[h.symbol]?.change}/>: '—'} sharesLine={`${tr('股數','Shares')} ${h.shares.toLocaleString()}`} averageLine={`${tr('均價','Avg.')} ${h.shares>0?fmtUnit(h.cost/h.shares):'—'}`} valueLine={q>0?money(h.shares*q):'—'} profit={profit!==null?result(profit):'—'} rate={profit!==null?percent(h.cost>0?profit/h.cost*100:null):'—'} profitTone={toneClass(profit)} onOpen={()=>onSelect(h.symbol)}/>;}):<p className="hint">{tr('沒有持股記錄','No current holdings')}</p>}</div>
    </section></InvestmentStackCard>
    <InvestmentStackCard accent="coral" title={tr("已實現交易","Realized trades")} summary={null} amount={money(totalSaleProceeds)} profit={result(sumRealized)} rate={sumBasis>0?percent(sumRealized/sumBasis*100):"—"} profitTone={toneClass(sumRealized)}><section className="glass panel stock-performance-section investment-stage-list">
      {sold.length?<><div className="investment-tier-stack investment-asset-substack">{sold.map(g=>{const latestSell=g.transactions?.filter(x=>x.action==='sell').sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0];return <InvestmentStackAsset key={g.symbol} accent="coral" stockLayout title={`${g.symbol}${g.securityName?` · ${g.securityName}`:''}`} topRight={latestSell&&Number.isFinite(Number(latestSell.price))?fmtUnit(latestSell.price):'—'} sharesLine={`${tr('股數','Shares')} ${g.soldShares.toLocaleString()}`} valueLine={money((g.transactions||[]).filter(x=>x.action==='sell').reduce((sum,x)=>sum+(Number(x.totalAmount)||0),0))} profit={result(g.realized)} rate={rate(g)} profitTone={toneClass(g.realized)} onOpen={()=>onSelect(g.symbol)}/>})}</div>
      </>:<p className="hint">{tr('尚未有賣出交易，賣出後會自動計算實際損益。','No sales yet. Realized P/L will appear after selling.')}</p>}
    </section></InvestmentStackCard>
    {other.length>0&&<InvestmentStackCard accent="mint" title={tr('其他股票紀錄','Other stock records')} summary={null} amount={null}>
      <section className="glass panel stock-performance-section investment-stage-list">
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
