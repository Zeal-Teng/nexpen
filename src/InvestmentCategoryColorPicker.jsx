import React,{useState} from 'react';
import {createPortal} from 'react-dom';
import {Check,ChevronRight,X} from 'lucide-react';

export const INVESTMENT_CATEGORY_DEFAULT_COLORS={
 stocks:'#caa8dc',trust:'#ff9579',policy:'#23c5bf',fund:'#7fa7d6',
 bond:'#7bc1b0',savings:'#bda0e7',termDeposit:'#e3ba69'
};
export const INVESTMENT_COLOR_CHOICES=[
 '#caa8dc','#ff9579','#23c5bf','#7fa7d6','#7bc1b0','#bda0e7',
 '#e3ba69','#ef9ca8','#7dbcc9','#94b96a','#e7a568','#92a5e9'
];
export function validInvestmentColor(value){return typeof value==='string'&&/^#[0-9a-fA-F]{6}$/.test(value)}
export function categoryColor(type,colors={}){
 const selected=colors?.[type];return validInvestmentColor(selected)?selected:INVESTMENT_CATEGORY_DEFAULT_COLORS[type]||'#caa8dc';
}
export default function InvestmentCategoryColorPicker({type,colors={},onChange}){
 const [open,setOpen]=useState(false);
 if(!type||!onChange)return null;
 const value=categoryColor(type,colors);
 return <div className="investment-category-color-picker" role="group" aria-label="卡片顏色">
  <span className="investment-category-color-label">卡片顏色</span>
  <button type="button" className="investment-category-color-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}>
   <span className="investment-category-current"><i style={{backgroundColor:value}} aria-hidden="true"/><span>{value.toUpperCase()}</span></span><ChevronRight size={18} aria-hidden="true"/>
  </button>
  {open&&createPortal(<div className="picker-backdrop investment-select-backdrop investment-color-backdrop" onClick={()=>setOpen(false)}>
   <div className="picker-sheet investment-color-sheet" role="dialog" aria-modal="true" aria-label="卡片顏色" onClick={e=>e.stopPropagation()}>
    <div className="picker-handle"/><div className="picker-heading"><b>卡片顏色</b><button type="button" className="sheet-close-button" aria-label="關閉" onClick={()=>setOpen(false)}><X size={21}/></button></div>
    <div className="investment-color-options">
     {INVESTMENT_COLOR_CHOICES.map(color=><button key={color} type="button" className={'investment-color-swatch'+(value.toLowerCase()===color.toLowerCase()?' selected':'')} aria-label={`選擇顏色 ${color}`} aria-pressed={value.toLowerCase()===color.toLowerCase()} style={{'--swatch-color':color}} onClick={()=>{onChange(type,color);setOpen(false)}}>{value.toLowerCase()===color.toLowerCase()&&<Check size={18} aria-hidden="true"/>}</button>)}
    </div>
    <label className="investment-color-custom-sheet">自訂顏色<input type="color" aria-label="自訂卡片顏色" value={value} onChange={e=>onChange(type,e.target.value)}/></label>
   </div>
  </div>,document.body)}
 </div>;
}
