import React,{useState} from 'react';
import {createPortal} from 'react-dom';
import {Check,X} from 'lucide-react';

const CHOICES=['#79bada','#e9ca8f','#eb93a2','#b2a0e4','#91cbb0','#e0a37b','#88b5a4','#90a4d4','#cba6c9','#b5c27a','#d49fa4','#8fabb5'];
const DEFAULTS={bank:'#79bada',cash:'#e9ca8f',credit:'#eb93a2',ewallet:'#b2a0e4',brokerage:'#91cbb0'};
const validColor=color=>typeof color==='string'&&/^#[0-9a-fA-F]{6}$/.test(color);

export default function AccountTypeColorPicker({value='',typeId='',onChange}){
 const [open,setOpen]=useState(false);
 const current=validColor(value)?value:(DEFAULTS[typeId]||'#8fabb5');
 return <div className="investment-category-color-picker investment-category-color-picker-icon" role="group" aria-label="帳戶類型卡片顏色">
  <button type="button" className="circle-button investment-category-color-circle" title="卡片顏色" aria-label="卡片顏色" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}>
   <span className="investment-category-color-icon" style={{backgroundColor:current}} aria-hidden="true"/>
  </button>
  {open&&createPortal(<div className="picker-backdrop investment-select-backdrop investment-color-backdrop" onClick={()=>setOpen(false)}>
   <div className="picker-sheet investment-color-sheet" role="dialog" aria-modal="true" aria-label="卡片顏色" onClick={e=>e.stopPropagation()}>
    <div className="picker-handle"/><div className="picker-heading"><b>卡片顏色</b><button type="button" className="sheet-close-button" aria-label="關閉" onClick={()=>setOpen(false)}><X size={21}/></button></div>
    <div className="investment-color-options">
     {CHOICES.map(color=><button key={color} type="button" className={'investment-color-swatch'+(current.toLowerCase()===color.toLowerCase()?' selected':'')} aria-label={`選擇顏色 ${color}`} aria-pressed={current.toLowerCase()===color.toLowerCase()} style={{'--swatch-color':color}} onClick={()=>{onChange(color);setOpen(false)}}>{current.toLowerCase()===color.toLowerCase()&&<Check size={18} aria-hidden="true"/>}</button>)}
    </div>
    <label className="investment-color-custom-sheet">自訂顏色<input type="color" aria-label="自訂卡片顏色" value={current} onChange={e=>onChange(e.target.value)}/></label>
    <button type="button" className="account-type-color-reset-sheet" onClick={()=>{onChange('');setOpen(false)}}>使用預設顏色</button>
   </div>
  </div>,document.body)}
 </div>;
}
