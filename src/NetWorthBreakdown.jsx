import React,{useState} from 'react';
import {Wallet,Landmark,ChartNoAxesCombined,Shield,Layers3,Coins,AlertCircle,ChevronRight} from 'lucide-react';
import {ASSET_GROUPS} from './netWorth.js';
import SummaryHero from './SummaryHero.jsx';
import NetWorthTrend from './NetWorthTrend.jsx';
import NetWorthGoal from './NetWorthGoal.jsx';

const translations={
 'zh-TW':{title:'資產配置',gross:'總資產',debt:'總負債',net:'淨資產',ratio:'資產比例',liabilities:'負債明細',none:'目前沒有負債',empty:'尚未有可計算的資產',unknown:'部分投資缺少有效報價，以下為已知估值；淨資產可能低估。',cash:'現金',deposit:'存款',securities:'證券',trust:'持股信託',insurance:'保險',other:'其他資產',assetCount:'項資產',liabilityCount:'筆負債',credit:'信用卡欠款',overdraft:'帳戶透支'},
 'zh-CN':{title:'资产配置',gross:'总资产',debt:'总负债',net:'净资产',ratio:'资产比例',liabilities:'负债明细',none:'目前没有负债',empty:'尚未有可计算的资产',unknown:'部分投资缺少有效报价，以下为已知估值；净资产可能低估。',cash:'现金',deposit:'存款',securities:'证券',trust:'持股信托',insurance:'保险',other:'其他资产',assetCount:'类资产',liabilityCount:'笔负债',credit:'信用卡欠款',overdraft:'账户透支'},
 en:{title:'Asset allocation',gross:'Total assets',debt:'Total liabilities',net:'Net worth',ratio:'Share of assets',liabilities:'Liabilities',none:'No liabilities recorded',empty:'No assets to display',unknown:'Some investments have no valid quote. Totals show known values and may understate net worth.',cash:'Cash',deposit:'Deposits',securities:'Securities',trust:'Stock trusts',insurance:'Insurance',other:'Other assets',assetCount:'asset categories',liabilityCount:'liabilities',credit:'Credit card debt',overdraft:'Account overdraft'},
 ja:{title:'資産構成',gross:'総資産',debt:'負債合計',net:'純資産',ratio:'資産比率',liabilities:'負債明細',none:'負債はありません',empty:'表示する資産がありません',unknown:'一部の投資の時価が未取得です。合計は既知の金額のみで計算しています。',cash:'現金',deposit:'預金',securities:'証券',trust:'株式信託',insurance:'保険',other:'その他資産',assetCount:'資産区分',liabilityCount:'件の負債',credit:'カード債務',overdraft:'口座のマイナス残高'}
};
const icons={cash:Wallet,deposit:Landmark,securities:ChartNoAxesCombined,trust:Layers3,insurance:Shield,other:Coins};
const colors={cash:'#35b9ab',deposit:'#638bd9',securities:'#a88be5',trust:'#ff9b82',insurance:'#e7b75f',other:'#8fa6b0'};

export default function NetWorthBreakdown({data,format,language='zh-TW',currency='TWD',history=[],goalTwd=null,mainRate=1,onSaveGoal=()=>{}}){
 const t=translations[language]||translations['zh-TW'];
 const [openCard,setOpenCard]=useState(null);
 // 與投資頁面完全共用 Card Stack 元件，保持相同的堆疊露邊、展開和陰影。
 const money=value=>currency==='TWD'?format(value):`${currency} ${format(value)}`;
 const formatPct=value=>`${value.toFixed(1)}%`;
 return <section className="networth-breakdown" aria-label={t.title}>
   <SummaryHero className="networth-overview-hero" eyebrow="NEXPEN · NET WORTH" title={t.net} label={t.net} value={money(data.netWorth)} detailId="networth-hero-details">
     <p className="summary-hero-description">{language==='en'?'Cash, deposits, securities, trusts and insurance, minus liabilities':language==='ja'?'現金・預金・証券・信託・保険から負債を控除':language==='zh-CN'?'现金、存款、证券、信托与保险，扣除负债':'現金、存款、證券、信託與保險，扣除負債'}</p>
     <div className="summary-hero-metrics"><div><small>{t.gross}</small><strong>{money(data.totalAssets)}</strong></div><div><small>{t.debt}</small><strong className={data.totalLiabilities>0?'expense':''}>{money(data.totalLiabilities)}</strong></div></div>
   </SummaryHero>
   <NetWorthTrend history={history} format={format} currency={currency} language={language}/>
   <NetWorthGoal goalTwd={goalTwd} currentTwd={data.netWorth} mainRate={mainRate} currency={currency} language={language} incomplete={data.missingQuotes.length>0} onSave={onSaveGoal}/>
   {data.missingQuotes.length>0&&<p className="networth-quote-warning"><AlertCircle size={16}/><span>{t.unknown} ({[...new Set(data.missingQuotes)].join('、')})</span></p>}
   <div className="investment-dashboard-section-title networth-section-title">
     <div><h3>{language==='en'?'Asset allocation & liabilities':language==='ja'?'資産構成と負債':language==='zh-CN'?'资产配置与负债':'資產配置與負債'}</h3><small>{language==='en'?'Tap a card to see allocation ratios and account details':language==='ja'?'カードをタップして資産比率と負債の内訳を表示':language==='zh-CN'?'点选卡片查看资产比例与负债明细':'點選卡片查看資產比例、各類金額與負債明細'}</small></div>
     <span aria-hidden="true">02</span>
   </div>
   <div className="investment-dashboard networth-stack-dashboard">
    <div className="investment-combined-list investment-peek-stack investment-reference-stack investment-first-level-stack networth-reference-stack">
     <article className={'investment-reference-layer invest-stack-policy networth-reference-layer'+(openCard==='asset'?' networth-layer-expanded':'')}>
      <button type="button" className="investment-reference-card networth-reference-card" aria-expanded={openCard==='asset'} onClick={()=>setOpenCard(v=>v==='asset'?null:'asset')}>
       <span className="investment-reference-main"><span className="investment-reference-copy"><span className="networth-peek-heading"><span className="networth-peek-dot" aria-hidden="true"/><b>{t.title}</b><ChevronRight size={19} aria-hidden="true" className={'networth-card-chevron'+(openCard==='asset'?' is-open':'')}/></span><small>{data.assets.length} {t.assetCount}</small></span><span className="investment-reference-amount"><strong className="investment-reference-net">{money(data.totalAssets)}</strong></span></span>
      </button>
      <div className={'networth-card-expanded-body'+(openCard==='asset'?' is-open':'')} aria-hidden={openCard!=='asset'} inert={openCard!=='asset'}><div className="networth-card-expanded-inner">
       <div className="networth-chart-heading"><strong>{t.ratio}</strong><small>{data.assets.length?'100%':'0%'}</small></div>
       <div className="networth-stacked-bar" role="img" aria-label={data.assets.map(a=>`${t[a.id]||t.other} ${formatPct(a.percent)}`).join('、')||t.empty}>
        {data.assets.map(a=><div key={a.id} className="networth-bar-segment" style={{width:`${a.percent}%`,backgroundColor:colors[a.id]}} title={`${t[a.id]||t.other} ${formatPct(a.percent)}`}/>)}
       </div>
       {data.assets.length===0&&<p className="hint">{t.empty}</p>}
       <div className="networth-asset-list">{data.assets.map(a=>{const Icon=icons[a.id];return <div className="networth-asset-row" key={a.id}><span className="networth-asset-label"><span className="networth-asset-symbol" style={{backgroundColor:colors[a.id]}}><Icon size={21} strokeWidth={2.1}/></span><b>{t[a.id]||t.other}</b></span><span className="networth-asset-amount"><strong>{money(a.amount)}</strong><small>{formatPct(a.percent)}</small></span></div>})}</div>
      </div></div>
     </article>
     <article className={'investment-reference-layer invest-stack-trust networth-reference-layer'+(openCard==='debt'?' networth-layer-expanded':'')}>
      <button type="button" className="investment-reference-card networth-reference-card" aria-expanded={openCard==='debt'} onClick={()=>setOpenCard(v=>v==='debt'?null:'debt')}>
       <span className="investment-reference-main"><span className="investment-reference-copy"><span className="networth-peek-heading"><span className="networth-peek-dot" aria-hidden="true"/><b>{t.liabilities}</b><ChevronRight size={19} aria-hidden="true" className={'networth-card-chevron'+(openCard==='debt'?' is-open':'')}/></span><small>{data.liabilities.length} {t.liabilityCount}</small></span><span className="investment-reference-amount"><strong className="investment-reference-net">{money(data.totalLiabilities)}</strong></span></span>
      </button>
      <div className={'networth-card-expanded-body'+(openCard==='debt'?' is-open':'')} aria-hidden={openCard!=='debt'} inert={openCard!=='debt'}><div className="networth-card-expanded-inner">
       {data.liabilities.length?<div className="networth-liability-list">{data.liabilities.map(a=><div key={a.id} className="networth-liability-row"><span><b>{a.name}</b><small>{a.type==='credit'?t.credit:t.overdraft}</small></span><strong className="expense">{money(a.amount)}</strong></div>)}</div>:<p className="hint networth-no-debt">{t.none}</p>}</div></div>
     </article>
    </div>
   </div>
 </section>;
}
