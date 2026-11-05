import React,{useEffect,useState} from 'react';

// Animates numeric display text on mount/update. Never modifies accounting numbers.
export default function AnimatedNumber({value,className='',duration=680}){
 const target=String(value??'');
 const match=target.match(/^([^\d+\-−]*)([+\-−]?)([\d,]+(?:\.\d+)?)(.*)$/);
 const parsed=match?Number(match[3].replace(/,/g,''))*(match[2]==='-'||match[2]==='−'?-1:1):NaN;
 const [shown,setShown]=useState(target);
 useEffect(()=>{
  if(!match||!Number.isFinite(parsed)||typeof window==='undefined'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setShown(target);return;}
  let frame=0;const start=performance.now(),prec=(match[3].split('.')[1]||'').length;
  const render=(v)=>{const sign=v<0?'−':match[2]==='+'?'+':'';return `${match[1]}${sign}${Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:prec,maximumFractionDigits:prec})}${match[4]}`};
  setShown(render(0));
  function step(now){const t=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-t,3);setShown(t===1?target:render(parsed*eased));if(t<1)frame=requestAnimationFrame(step)}
  frame=requestAnimationFrame(step);return ()=>cancelAnimationFrame(frame);
 },[target,duration]);
 return <span className={'nexpen-countup '+className} aria-label={target}>{shown}</span>;
}
