import {t as i18n} from './i18n.js';
import React,{useState} from 'react';
import {createPortal} from 'react-dom';
import {Check,X} from 'lucide-react';
function calculate(expression){
 const parts=String(expression).replace(/×/g,'*').replace(/÷/g,'/').match(/(?:\d+\.?\d*|\.\d+)|[+*/-]/g)||[];
 if(!parts.length)return 0;
 let values=[],ops=[];const priority=o=>o==='+'||o==='-'?1:2;
 const apply=()=>{const b=values.pop(),a=values.pop(),o=ops.pop();if(a===undefined||b===undefined)throw Error('算式不完整');const n=o==='+'?a+b:o==='-'?a-b:o==='*'?a*b:a/b;if(!Number.isFinite(n))throw Error('無法除以零');values.push(n)};
 for(let i=0;i<parts.length;i++){const t=parts[i];if(/^\d|^\./.test(t))values.push(Number(t));else if(t==='-'&&(i===0||/[+*/-]/.test(parts[i-1])))values.push(0),ops.push('-');else{while(ops.length&&priority(ops.at(-1))>=priority(t))apply();ops.push(t)}}while(ops.length)apply();if(values.length!==1)throw Error('算式有誤');return Math.round(values[0]*1000000)/1000000;
}
function Calculator({initial,onDone,onClose}){
 const[expr,setExpr]=useState(String(initial||''));const[error,setError]=useState('');
 const press=k=>{setError('');if(k==='C')return setExpr('');if(k==='⌫')return setExpr(s=>s.slice(0,-1));if(k==='='){try{setExpr(String(calculate(expr)))}catch(e){setError(e.message)}return}if('+-×÷'.includes(k))return setExpr(s=>s&&!/[+\-×÷]$/.test(s)?s+k:s);setExpr(s=>s+k)};
 return createPortal(<div className="calculator-backdrop" onClick={onClose}><div className="calculator-sheet" onClick={e=>e.stopPropagation()}><div className="picker-handle"/><div className="calculator-heading"><b>{i18n("金額計算機")}</b><button className="sheet-close-button" aria-label={i18n("關閉計算機")} onClick={onClose} type="button"><X size={21}/></button></div><div className="calc-display">{expr||'0'}</div><div className="calc-result">{error||'可輸入 100+20×3，再按 = 計算'}</div><div className="calc-keys">{['C','⌫','÷','×','7','8','9','−','4','5','6','+','1','2','3','=','0','00','.','完成'].map(k=><button key={k} type="button" className={'calc-key '+('÷×−+=' .includes(k)?'operator ':'')+(k==='完成'?'finish':'')} onClick={()=>{if(k==='完成'){try{const v=calculate(expr);if(v<0)throw Error('金額不可為負數');onDone(String(v));onClose()}catch(e){setError(e.message)}}else press(k==='−'?'-':k)}}>{k}</button>)}</div></div></div>,document.body);
}

export default Calculator;
