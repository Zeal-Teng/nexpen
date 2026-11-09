import React,{useMemo,useState} from 'react';
import {ChevronLeft,ChevronRight,CalendarDays,TrendingUp,TrendingDown,ChartPie} from 'lucide-react';
import {aggregateIncomeExpense} from './incomeExpenseReport.js';
import './income-expense-report.css';

function movePeriod(date,period,delta){
 const [y,m,d]=date.split('-').map(Number);
 const next=period==='year'?new Date(y+delta,m-1,Math.min(d,28)):period==='month'?new Date(y,m-1+delta,Math.min(d,28)):new Date(y,m-1,d+delta);
 return `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
}
const labels={ 'zh-TW':{report:'收支報表',day:'日',month:'月',year:'年',income:'收入',expense:'支出',net:'收支結餘',main:'主分類',sub:'子分類',category:'分類排行',trend:'收支趨勢',none:'此期間尚無收支紀錄',records:'筆',today:'今天',nowMonth:'本月',nowYear:'今年',note:'轉帳、帳戶校正與投資買賣本金不計入一般收支。'},en:{report:'Income & expense report',day:'Day',month:'Month',year:'Year',income:'Income',expense:'Expenses',net:'Net cash flow',main:'Categories',sub:'Subcategories',category:'Category breakdown',trend:'Cash flow trend',none:'No income or expenses for this period',records:'entries',today:'Today',nowMonth:'This month',nowYear:'This year',note:'Transfers, balance adjustments and investment principal are excluded.'}};
export default function IncomeExpenseReport({rows=[],primaryCurrency='TWD',primaryTwdRate=1,initialDate,period:externalPeriod,date:externalDate,embedded=false,language='zh-TW'}){
 const [localPeriod,setLocalPeriod]=useState('month');
 const [localDate,setLocalDate]=useState(initialDate||new Date().toISOString().slice(0,10));
 const period=embedded?externalPeriod||'day':localPeriod;
 const date=embedded?externalDate||localDate:localDate;
 const [flow,setFlow]=useState('expense');
 const [level,setLevel]=useState('main');
 const t=labels[language]||labels['zh-TW'];
 const report=useMemo(()=>aggregateIncomeExpense(rows,{period,date,flow,level}),[rows,period,date,flow,level]);
 const rate=primaryCurrency==='TWD'?1:Number(primaryTwdRate);
 const canConvert=Number.isFinite(rate)&&rate>0;
 const format=n=>canConvert?new Intl.NumberFormat(language||'zh-TW',{maximumFractionDigits:['JPY','KRW'].includes(primaryCurrency)?0:2}).format(n/rate):'—';
 const now=()=>{const today=new Date();setLocalDate(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`)};
 const dateLabel=period==='year'?date.slice(0,4):period==='month'?date.slice(0,7):date;
 const maxTick=Math.max(1,...report.timeline.flatMap(r=>[r.income,r.expense]));
 return <div className={"income-expense-report"+(embedded?" embedded-report":"")}>
  {!embedded&&<section className="glass report-panel">
   <div className="report-period-tabs" role="group" aria-label={t.report}>{['day','month','year'].map(key=><button type="button" key={key} aria-pressed={period===key} className={period===key?'selected':''} onClick={()=>setLocalPeriod(key)}>{t[key]}</button>)}</div>
   <div className="report-period-nav"><button type="button" onClick={()=>setLocalDate(d=>movePeriod(d,period,-1))} aria-label="上一期"><ChevronLeft size={20}/></button><strong>{dateLabel}</strong><button type="button" onClick={()=>setLocalDate(d=>movePeriod(d,period,1))} aria-label="下一期"><ChevronRight size={20}/></button><button type="button" className="report-now" onClick={now}><CalendarDays size={15}/>{period==='day'?t.today:period==='year'?t.nowYear:t.nowMonth}</button></div>
  </section>}
  {!embedded&&<div className="report-summary-grid">
   <div className="glass report-summary-card"><span>{t.income}</span><strong className="income">{format(report.income)}</strong></div>
   <div className="glass report-summary-card"><span>{t.expense}</span><strong className="expense">{format(report.expense)}</strong></div>
   <div className="glass report-summary-card"><span>{t.net}</span><strong className={report.net>=0?'income':'expense'}>{format(report.net)}</strong><small>{report.count} {t.records}</small></div>
  </div>}
  <section className="glass report-panel">
   <div className="report-section-head"><h2><ChartPie size={19}/>{t.category}</h2><span>{primaryCurrency}</span></div>
   <div className="report-switches"><div className="report-pill-switch">{['expense','income'].map(k=><button type="button" key={k} className={flow===k?'selected':''} aria-pressed={flow===k} onClick={()=>setFlow(k)}>{k==='income'?<TrendingUp size={16}/>:<TrendingDown size={16}/>} {t[k]}</button>)}</div><div className="report-pill-switch">{['main','sub'].map(k=><button type="button" key={k} className={level===k?'selected':''} aria-pressed={level===k} onClick={()=>setLevel(k)}>{t[k]}</button>)}</div></div>
   {report.categories.length?<div className="report-categories">{report.categories.map((g,i)=><div className="report-category-row" key={g.main+'/'+g.sub}><div className="report-category-top"><span><b>{i+1}. {g.name}</b>{level==='sub'&&<small>{g.main}</small>}</span><span><strong>{format(g.value)}</strong><small>{g.percent.toFixed(1)}% · {g.count} {t.records}</small></span></div><div className="report-bar-track"><div className={'report-bar-fill '+flow} style={{width:`${g.percent}%`}}/></div></div>)}</div>:<p className="report-empty">{t.none}</p>}
  </section>
  <section className="glass report-panel">
   <div className="report-section-head"><h2><TrendingUp size={19}/>{t.trend}</h2><span>{primaryCurrency}</span></div>
   {report.timeline.length?<div className="report-timeline">{report.timeline.map(tick=><div className="report-timeline-row" key={tick.key}><span className="report-tick">{tick.key}</span><div className="report-dual-bars"><div className="report-mini-bar income" style={{width:`${Math.max(0,tick.income/maxTick*100)}%`}} title={`${t.income}: ${format(tick.income)}`}/><div className="report-mini-bar expense" style={{width:`${Math.max(0,tick.expense/maxTick*100)}%`}} title={`${t.expense}: ${format(tick.expense)}`}/></div><span className="report-tick-value">{format(tick.income-tick.expense)}</span></div>)}</div>:<p className="report-empty">{t.none}</p>}
   <div className="report-legend"><span className="report-legend-income">● {t.income}</span><span className="report-legend-expense">● {t.expense}</span></div>
  </section>
  <p className="report-footnote">{t.note}{!canConvert?` ${primaryCurrency} 匯率尚未取得，金額暫不顯示。`:''}</p>
 </div>;
}
