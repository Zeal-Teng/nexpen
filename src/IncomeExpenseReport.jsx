import {moneySymbol} from './moneyDisplay.js';
import React,{useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {ChevronLeft,ChevronRight,CalendarDays,TrendingUp,TrendingDown,ChartPie,X} from 'lucide-react';
import {aggregateIncomeExpense,expenseIncomeRatio,selectReportEntries} from './incomeExpenseReport.js';
import './income-expense-report.css';

function movePeriod(date,period,delta){
 const [y,m,d]=date.split('-').map(Number);
 const next=period==='year'?new Date(y+delta,m-1,Math.min(d,28)):period==='month'?new Date(y,m-1+delta,Math.min(d,28)):new Date(y,m-1,d+delta);
 return `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
}
const labels={ 'zh-TW':{report:'收支報表',day:'日',month:'月',year:'年',income:'收入',expense:'支出',net:'收支結餘',main:'主分類',sub:'子分類',category:'分類排行',trend:'收支趨勢',ratio:'當月收支比',ratioCaption:'當月支出 ÷ 當月收入',none:'此期間尚無收支紀錄',records:'筆',details:'符合的交易明細',close:'關閉',today:'今天',nowMonth:'本月',nowYear:'今年',note:'轉帳、帳戶校正與投資買賣本金不計入一般收支。'},en:{report:'Income & expense report',day:'Day',month:'Month',year:'Year',income:'Income',expense:'Expenses',net:'Net cash flow',main:'Categories',sub:'Subcategories',category:'Category breakdown',trend:'Cash flow trend',ratio:'Monthly expense ratio',ratioCaption:'Monthly expenses / monthly income',none:'No income or expenses for this period',records:'entries',details:'Matching transactions',close:'Close',today:'Today',nowMonth:'This month',nowYear:'This year',note:'Transfers, balance adjustments and investment principal are excluded.'}};
export default function IncomeExpenseReport({rows=[],primaryCurrency='TWD',primaryTwdRate=1,initialDate,period:externalPeriod,date:externalDate,embedded=false,language='zh-TW',onSelectRow}){
 const [localPeriod,setLocalPeriod]=useState('month');
 const [localDate,setLocalDate]=useState(initialDate||new Date().toISOString().slice(0,10));
 const period=embedded?externalPeriod||'day':localPeriod;
 const date=embedded?externalDate||localDate:localDate;
 const [flow,setFlow]=useState('expense');
 const [level,setLevel]=useState('main');
 const [selection,setSelection]=useState(null);
 const t=labels[language]||labels['zh-TW'];
 const report=useMemo(()=>aggregateIncomeExpense(rows,{period,date,flow,level}),[rows,period,date,flow,level]);
 // Daily income is irregular: ratio is meaningful only for a full calendar month.
 const monthlyReport=useMemo(()=>aggregateIncomeExpense(rows,{period:'month',date,flow,level}),[rows,date,flow,level]);
 const scopeKey=`${period}|${date}|${flow}|${level}`;
 const activeSelection=selection?.scopeKey===scopeKey?selection:null;
 // The diary lives inside a transformed/clipped application shell. Portal the
 // detail sheet to body so fixed positioning uses the real viewport on iOS.
 useEffect(()=>{
  if(!activeSelection)return undefined;
  const handleKey=event=>{if(event.key==='Escape')setSelection(null);};
  document.addEventListener('keydown',handleKey);
  return ()=>document.removeEventListener('keydown',handleKey);
 },[activeSelection]);
 const detailRows=useMemo(()=>activeSelection?selectReportEntries(rows,{period,date,...activeSelection}):[],[rows,period,date,activeSelection]);
 const rate=primaryCurrency==='TWD'?1:Number(primaryTwdRate);
 const canConvert=Number.isFinite(rate)&&rate>0;
 const format=n=>canConvert?moneySymbol(new Intl.NumberFormat(language||'zh-TW',{maximumFractionDigits:['JPY','KRW'].includes(primaryCurrency)?0:2}).format(n/rate)):'—';
 const now=()=>{const today=new Date();setLocalDate(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`)};
 const dateLabel=period==='year'?date.slice(0,4):period==='month'?date.slice(0,7):date;
 const maxTick=Math.max(1,...report.timeline.flatMap(r=>[r.income,r.expense]));
 const renderRatio=(income,expense)=>{const value=expenseIncomeRatio(income,expense);return value===null?'—':`${new Intl.NumberFormat(language||'zh-TW',{maximumFractionDigits:1,minimumFractionDigits:1}).format(value)}%`;};
 return <div className={"income-expense-report"+(embedded?" embedded-report":"")}>
  {!embedded&&<section className="glass report-panel">
   <div className="report-period-tabs" role="group" aria-label={t.report}>{['day','month','year'].map(key=><button type="button" key={key} aria-pressed={period===key} className={period===key?'selected':''} onClick={()=>setLocalPeriod(key)}>{t[key]}</button>)}</div>
   <div className="report-period-nav"><button type="button" onClick={()=>setLocalDate(d=>movePeriod(d,period,-1))} aria-label="上一期"><ChevronLeft size={20}/></button><strong>{dateLabel}</strong><button type="button" onClick={()=>setLocalDate(d=>movePeriod(d,period,1))} aria-label="下一期"><ChevronRight size={20}/></button><button type="button" className="report-now" onClick={now}><CalendarDays size={15}/>{period==='day'?t.today:period==='year'?t.nowYear:t.nowMonth}</button></div>
  </section>}
  {!embedded&&<div className="report-summary-grid">
   <div className="glass report-summary-card"><span>{t.income}</span><strong className="income">{format(report.income)}</strong></div>
   <div className="glass report-summary-card"><span>{t.expense}</span><strong className="expense">{format(report.expense)}</strong></div>
   <div className="glass report-summary-card"><span>{t.net}</span><strong className={report.net>=0?'income':'expense'}>{format(report.net)}</strong></div>
  </div>}
  <section className="glass report-panel">
   <div className="report-section-head"><h2><ChartPie size={19}/>{t.category}</h2></div>
   <div className="report-switches"><div className="report-pill-switch">{['expense','income'].map(k=><button type="button" key={k} className={flow===k?'selected':''} aria-pressed={flow===k} onClick={()=>setFlow(k)}>{k==='income'?<TrendingUp size={16}/>:<TrendingDown size={16}/>} {t[k]}</button>)}</div><div className="report-pill-switch">{['main','sub'].map(k=><button type="button" key={k} className={level===k?'selected':''} aria-pressed={level===k} onClick={()=>setLevel(k)}>{t[k]}</button>)}</div></div>
   {report.categories.length?<div className="report-categories">{report.categories.map((g,i)=><button type="button" className="report-category-row report-drilldown-trigger" key={g.main+'/'+g.sub} aria-label={`${g.name} · ${t.details}`} onClick={()=>setSelection({scopeKey,kind:'category',flow,level,main:g.main,sub:g.sub,title:g.name})}><div className="report-category-top"><span><b>{i+1}. {g.name}</b>{level==='sub'&&<small>{g.main}</small>}</span><span className="report-category-values"><strong>{format(g.value)}</strong><small>{g.percent.toFixed(1)}%</small></span><ChevronRight className="report-row-chevron" size={17}/></div><div className="report-bar-track"><div className={'report-bar-fill '+flow} style={{width:`${g.percent}%`}}/></div></button>)}</div>:<p className="report-empty">{t.none}</p>}
  </section>
  <section className="glass report-panel">
   <div className="report-section-head"><h2><TrendingUp size={19}/>{t.trend}</h2></div>
   {period!=='year'&&<div className="report-ratio-summary" aria-label={`${t.ratio}: ${renderRatio(monthlyReport.income,monthlyReport.expense)}`}>
    <div className="report-ratio-summary-copy"><strong>{t.ratio}</strong><small>{date.slice(0,7)} · {t.ratioCaption}</small></div>
    <b className="report-ratio-summary-value">{renderRatio(monthlyReport.income,monthlyReport.expense)}</b>
   </div>}
   {report.timeline.length?<div className="report-timeline">{report.timeline.map(tick=><button type="button" className="report-timeline-row report-drilldown-trigger" key={tick.key} aria-label={`${tick.key} · ${t.details}`} onClick={()=>setSelection({scopeKey,kind:'timeline',tick:tick.key,title:tick.key})}><span className="report-tick">{tick.key}</span><div className="report-bidirectional-bars" role="img" aria-label={`${t.expense} ${format(tick.expense)}；${t.income} ${format(tick.income)}`}><span className="report-bidirectional-half expense" title={`${t.expense}: ${format(tick.expense)}`}><span className="report-bidirectional-fill expense" style={{width:`${Math.max(0,tick.expense/maxTick*100)}%`}}/></span><span className="report-bidirectional-half income" title={`${t.income}: ${format(tick.income)}`}><span className="report-bidirectional-fill income" style={{width:`${Math.max(0,tick.income/maxTick*100)}%`}}/></span></div><span className="report-tick-value">{period==='year'&&<strong>{renderRatio(tick.income,tick.expense)}</strong>}<small>{format(tick.income-tick.expense)}</small></span><ChevronRight className="report-row-chevron" size={16}/></button>)}</div>:<p className="report-empty">{t.none}</p>}
   <div className="report-legend"><span className="report-legend-expense">● {t.expense} ←</span><span className="report-legend-income">→ {t.income} ●</span><span className="report-legend-net">{t.net}</span></div>
  </section>
  {activeSelection&&typeof document!=='undefined'&&createPortal(<div className="report-details-backdrop" role="presentation" onClick={()=>setSelection(null)}>
   <section className="report-details-sheet" role="dialog" aria-modal="true" aria-label={`${t.details} · ${activeSelection.title}`} onClick={event=>event.stopPropagation()}>
    <div className="report-details-grabber"/>
    <header className="report-details-head"><div><strong>{activeSelection.title}</strong><small>{t.details}</small></div><button type="button" className="circle-button report-details-close" aria-label={t.close} onClick={()=>setSelection(null)}><X size={21}/></button></header>
    <div className="report-details-list" role="list">
     {detailRows.map((row,index)=><button type="button" role="listitem" key={`${row.id||row.date}-${index}`} className="report-details-entry" disabled={!onSelectRow} onClick={()=>{if(onSelectRow){setSelection(null);onSelectRow(row);}}}>
      <span className="report-details-entry-main"><b>{row.note||row.subCategory||row.mainCategory||t[row.type]}</b><small>{row.date} · {row.mainCategory||t[row.type]}{row.subCategory?` / ${row.subCategory}`:''}</small></span>
      <strong className={row.type==='income'?'income':'expense'}>{row.type==='income'?'+':'−'}{format(Number(row.reportAmount))}</strong>
      {onSelectRow&&<ChevronRight size={17}/>}</button>)}
    </div>
   </section>
  </div>,document.body)}
  <p className="report-footnote">{t.note}{!canConvert?` ${primaryCurrency} 匯率尚未取得，金額暫不顯示。`:''}</p>
 </div>;
}
