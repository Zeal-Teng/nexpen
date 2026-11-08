import React,{useState} from 'react';
import {createPortal} from 'react-dom';
import {Check,ChevronRight,X} from 'lucide-react';

/** Investment forms share the ledger's bottom-sheet picker instead of native selects. */
export default function InvestmentSheetSelect({value,onChange,children,disabled=false,label='請選擇'}){
 const [open,setOpen]=useState(false);
 const flatten=nodes=>React.Children.toArray(nodes).flatMap(n=>n?.type===React.Fragment?flatten(n.props.children):[n]);
 const options=flatten(children).filter(n=>React.isValidElement(n)&&n.type==='option').map(n=>({value:String(n.props.value??n.props.children),label:String(n.props.children??''),disabled:!!n.props.disabled}));
 const selected=options.find(o=>o.value===String(value));
 return <>
  <button type="button" className="investment-sheet-select" disabled={disabled} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><span>{selected?.label||label}</span><ChevronRight size={18} aria-hidden="true"/></button>
  {open&&createPortal(<div className="picker-backdrop investment-select-backdrop" onClick={()=>setOpen(false)}><div className="picker-sheet" role="dialog" aria-modal="true" aria-label={label} onClick={e=>e.stopPropagation()}><div className="picker-handle"/><div className="picker-heading"><b>{label}</b><button type="button" className="sheet-close-button" aria-label="關閉" onClick={()=>setOpen(false)}><X size={21}/></button></div><div className="picker-options">{options.map((o,i)=><button type="button" key={`${o.value}-${i}`} disabled={o.disabled} className={`picker-option ${String(value)===o.value?'picked':''}`} onClick={()=>{onChange({target:{value:o.value}});setOpen(false)}}><span>{o.label}</span>{String(value)===o.value&&<Check size={19}/>}</button>)}</div></div></div>,document.body)}
 </>;
}
