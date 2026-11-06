import React,{useState} from 'react';
import {ChevronRight,TrendingUp,TrendingDown} from 'lucide-react';
import {t as tr} from './i18n.js';

// Interactive overlapping cards: the exposed header always shows the financial summary.
// Tapping the header opens details; tapping it again collapses. Only one card per stack remains open.
export function InvestmentStack({children,className=''}) {
 const [expanded,setExpanded]=useState(null);
 const cards=React.Children.toArray(children).filter(Boolean);
 return <div className={'investment-tier-stack '+className}>
  {cards.map((child,index)=>React.isValidElement(child)?React.cloneElement(child,{
   expanded:expanded===index,onToggle:()=>setExpanded(prev=>prev===index?null:index),stackIndex:index
  }):child)}
 </div>;
}
export function InvestmentStackCard({title,summary,amount,accent='lavender',children,expanded=false,onToggle=()=>{},stackIndex=0,className=''}) {
 return <article className={'investment-tier-card tier-'+accent+(expanded?' tier-expanded':'')+' '+className} style={{'--tier-index':stackIndex}}>
  <button type="button" className="investment-tier-peek" aria-expanded={expanded} onClick={onToggle}>
   <span className="investment-tier-top"><span className="investment-tier-marker"/><strong>{title}</strong><ChevronRight size={20} className="tier-chevron"/></span>
   {summary&&<span className="investment-tier-subtitle">{summary}</span>}
   <span className="investment-tier-bottom">{amount&&<b>{amount}</b>}</span>
  </button>
  <div className={"investment-tier-collapse"+(expanded?" is-open":"")} aria-hidden={!expanded} inert={!expanded}><div className="investment-tier-body">{children}</div></div>
 </article>;
}
// Detail rows inside an expanded investment card match the Account Management
// ListView: no nested cards, and one tap opens the asset detail screen.
export function ClosingPrice({value,change}){
 const n=change===null||change===undefined||change===''?null:Number(change);
 const direction=n!==null&&Number.isFinite(n)?Math.sign(n):0;
 return <span className={'investment-quote-direction'+(direction>0?' income':direction<0?' expense':'')}>
  {direction>0?<TrendingUp size={15} aria-label="上漲"/>:direction<0?<TrendingDown size={15} aria-label="下跌"/>:null}
  <span>{value}</span>
 </span>;
}
export function InvestmentStackAsset({title,subtitle,amount,profit,rate,profitTone='',accent='lavender',onOpen,children,stockLayout=false,topRight=null,sharesLine=null,averageLine=null,valueLine=null}){
 if(stockLayout)return <button type="button" className={'investment-account-list-row investment-stock-list-row tier-'+accent} onClick={onOpen}>
  <span className="investment-stock-row-heading"><strong className="investment-stock-symbol">{title}</strong>{topRight!=null&&<span className="investment-stock-close">{topRight}</span>}</span>
  <span className="investment-account-list-info investment-stock-row-details">
   {sharesLine&&<small>{sharesLine}</small>}{averageLine&&<small>{averageLine}</small>}
  </span>
  <span className="investment-account-list-values investment-stock-row-results">
   {valueLine&&<b>{valueLine}</b>}
   {(profit!=null||rate)&&<span className="investment-performance-badges investment-listview-badges">
    {profit!=null&&<small className={'investment-tier-pnl '+(profitTone||'').trim()}>{profit}</small>}
    {rate&&<small className={'investment-tier-pnl '+(profitTone||'').trim()}>{rate}</small>}
   </span>}
  </span>
  <ChevronRight size={18} aria-hidden="true" className="investment-account-list-chevron"/>
 </button>;
 return <button type="button" className={'investment-account-list-row tier-'+accent} onClick={onOpen}>
   <span className="investment-account-list-info"><strong>{title}</strong>{subtitle&&<small>{subtitle}</small>}{children&&<span className="investment-account-list-extra">{children}</span>}</span>
   <span className="investment-account-list-values"><b>{amount}</b>{(profit!=null||rate)&&<span className="investment-performance-badges investment-listview-badges">{profit!=null&&<small className={'investment-tier-pnl '+(profitTone||'').trim()}>{profit}</small>}{rate&&<small className={'investment-tier-pnl '+(profitTone||'').trim()}>{rate}</small>}</span>}</span>
   <ChevronRight size={18} aria-hidden="true" className="investment-account-list-chevron"/>
 </button>;
}
