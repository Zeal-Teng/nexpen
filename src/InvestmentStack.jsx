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
  <div className={"investment-tier-collapse"+(expanded?" is-open":"")} aria-hidden={!expanded} inert={!expanded}><div className="investment-tier-body">{children}</div></div>
 </article>;
}
// Detail rows inside an expanded investment card match the Account Management
// ListView: no nested cards, and one tap opens the asset detail screen.
export function InvestmentStackAsset({title,subtitle,amount,profit,rate,profitTone='',accent='lavender',onOpen,children}){
 return <button type="button" className={'investment-account-list-row tier-'+accent} onClick={onOpen}>
   <span className="investment-account-list-info"><strong>{title}</strong>{subtitle&&<small>{subtitle}</small>}{children&&<span className="investment-account-list-extra">{children}</span>}</span>
   <span className="investment-account-list-values"><b>{amount}</b>{profit&&<small className={'investment-tier-pnl '+(profitTone||'').trim()}>{profit}{rate?` · ${rate}`:''}</small>}</span>
   <ChevronRight size={18} aria-hidden="true" className="investment-account-list-chevron"/>
 </button>;
}
