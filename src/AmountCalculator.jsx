import React,{useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
import {t} from './i18n.js';
import {normalizePastedAmount} from './amountClipboard.js';


function calculate(expression,precision=6){
  const raw=String(expression).replace(/×/g,'*').replace(/÷/g,'/').trim();
  if(!raw || !/^[0-9.+*/\s-]+$/.test(raw))throw new Error(t('算式有誤'));
  const tokens=raw.replace(/\s/g,'').match(/(?:\d+(?:\.\d*)?|\.\d+)|[+*/-]/g)||[];
  if(tokens.join('')!==raw.replace(/\s/g,''))throw new Error(t('算式有誤'));
  const vals=[],ops=[];const rank=o=>o==='+'||o==='-'?1:2;
  const apply=()=>{const b=vals.pop(),a=vals.pop(),op=ops.pop();if(a===undefined||b===undefined)throw new Error(t('算式不完整'));const v=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:a/b;if(!Number.isFinite(v))throw new Error(t('無法除以零'));vals.push(v)};
  let expecting=true;
  for(let i=0;i<tokens.length;i++){
    const part=tokens[i];if(/^[0-9.]/.test(part)){if(!expecting||!Number.isFinite(+part))throw new Error(t('算式有誤'));vals.push(+part);expecting=false;continue}
    if(expecting){if(part==='-' && i===0){vals.push(0);ops.push('-');continue}throw new Error(t('算式不完整'))}
    while(ops.length && rank(ops.at(-1))>=rank(part))apply();ops.push(part);expecting=true;
  }
  if(expecting)throw new Error(t('算式不完整'));
  while(ops.length)apply();if(vals.length!==1)throw new Error(t('算式有誤'));
  return Number(vals[0].toFixed(precision));
}
export default function AmountCalculator({initial,onDone,onClose,allowNegative=false,precision=6}){
 const [expr,setExpr]=useState(String(initial??''));const [error,setError]=useState('');const inputRef=useRef(null);
 const press=k=>{setError('');if(k==='C'){setExpr('');return}if(k==='⌫'){setExpr(s=>s.slice(0,-1));return}if(k==='='){try{setExpr(String(calculate(expr,precision)))}catch(e){setError(e.message)}return}if('+-−×÷'.includes(k)){setExpr(s=>k==='−'&&allowNegative&&(!s||s==='0')?'-':s&&!/[+\-×÷]$/.test(s)?s+(k==='−'?'-':k):s);return}setExpr(s=>s+k)};
 const pasteText=text=>{try{setExpr(normalizePastedAmount(text));setError('')}catch(e){setError(t(e.message))}};
 const finish=()=>{try{const v=calculate(expr||'0',precision);if(v<0&&!allowNegative)throw Error(t('金額不可為負數'));onDone(String(v));onClose()}catch(e){setError(e.message)}};
 const labels={'C':'清除全部','⌫':'退格','÷':'除以','×':'乘以','−':'減去','+':'加上','=':'計算結果','完成':'完成'};
 return createPortal(<div className="calculator-backdrop" onClick={onClose}><div className="calculator-sheet" onClick={e=>e.stopPropagation()}><div className="picker-handle"/><div className="calculator-heading"><b>{t('金額計算機')}</b><button className="sheet-close-button" aria-label={t('關閉計算機')} title={t('關閉計算機')} onClick={onClose} type="button"><X size={21}/></button></div>
 <input ref={inputRef} className="calc-display calc-editable" type="text" inputMode="decimal" autoComplete="off" spellCheck={false} aria-label={t('金額或算式')} title={t('可以直接編輯或長按貼上金額')} value={expr} placeholder="0" onChange={e=>{setExpr(e.target.value);setError('')}} onPaste={e=>{e.preventDefault();pasteText(e.clipboardData.getData('text'))}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();finish()}}}/>
 {error&&<div className="calc-error" role="alert">{error}</div>}
 <div className="calc-keys">{['C','⌫','÷','×','7','8','9','−','4','5','6','+','1','2','3','=','0','00','.','完成'].map(k=><button key={k} type="button" title={t(labels[k]||k)} aria-label={t(labels[k]||k)} className={'calc-key '+('÷×−+='.includes(k)?'operator ':'')+(k==='完成'?'finish':'')} onClick={()=>k==='完成'?finish():press(k)}>{k==='完成'?t(k):k}</button>)}</div></div></div>,document.body);
}
