import React, {useState} from 'react';
import {ChevronRight} from 'lucide-react';

/** Shared compact summary card: same layout and collapse behavior in Investment and Overview. */
export default function SummaryHero({eyebrow,title,label,value,children,className='',detailId}){
 const [expanded,setExpanded]=useState(false);
 return <section className={'summary-hero '+className+(expanded?' summary-hero-open':'')} aria-label={title}>
  <button type="button" className="summary-hero-trigger" aria-expanded={expanded} aria-controls={detailId} onClick={()=>setExpanded(v=>!v)}>
   <span className="summary-hero-heading"><span className="summary-hero-eyebrow">{eyebrow}</span><strong className="summary-hero-title">{title}</strong></span>
   <span className="summary-hero-arrow" aria-hidden="true"><ChevronRight size={21}/></span>
   <span className="summary-hero-value"><small>{label}</small><strong>{value}</strong></span>
  </button>
  <div id={detailId} className={'summary-hero-collapse'+(expanded?' is-open':'')} aria-hidden={!expanded} inert={!expanded}>
   <div className="summary-hero-inner">{children}</div>
  </div>
 </section>;
}
