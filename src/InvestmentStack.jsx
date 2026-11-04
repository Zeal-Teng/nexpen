import React,{useState} from 'react';
import {ChevronRight} from 'lucide-react';
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
  {expanded&&<div className="investment-tier-body">{children}</div>}
 </article>;
}
export function InvestmentStackAsset({title,subtitle,amount,profit,rate,accent='lavender',onOpen,children}){
 const [expanded,setExpanded]=useState(false);
 return <article className={'investment-tier-card tier-'+accent+(expanded?' tier-expanded':'')}>
  <button type="button" className="investment-tier-peek" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>
   <span className="investment-tier-top"><span className="investment-tier-marker"/><strong>{title}</strong><ChevronRight size={18} className="tier-chevron"/></span>
   {subtitle&&<span className="investment-tier-subtitle">{subtitle}</span>}
   <span className="investment-tier-bottom"><b>{amount}</b>{profit&&<small className="investment-tier-pnl">{profit}{rate?` · ${rate}`:""}</small>}</span>
  </button>
  {expanded&&<div className="investment-tier-body investment-tier-asset-body">
   {profit&&<div className="investment-tier-profit"><span>{tr('未實現損益')}</span><b>{profit}</b>{rate&&<small>{rate}</small>}</div>}
   {children}
   {onOpen&&<button type="button" className="investment-tier-open" onClick={onOpen}>{tr('查看明細')} <ChevronRight size={17}/></button>}
  </div>}
 </article>;
}
