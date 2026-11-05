import React,{forwardRef,useCallback,useLayoutEffect,useRef,useState} from 'react';

/** Non-invasive placeholder marquee. The input stays native and editable. */
const MarqueeInput=forwardRef(function MarqueeInput({placeholder='',value,defaultValue,onFocus,onBlur,className='',style,...rest},forwardedRef){
  const inputRef=useRef(null);
  const viewportRef=useRef(null);
  const textRef=useRef(null);
  const [focus,setFocus]=useState(false);
  const [overflow,setOverflow]=useState(0);
  const [isEmpty,setIsEmpty]=useState(!value&&!defaultValue);
  const assignRef=useCallback(node=>{
    inputRef.current=node;
    if(typeof forwardedRef==='function')forwardedRef(node);
    else if(forwardedRef)forwardedRef.current=node;
  },[forwardedRef]);
  useLayoutEffect(()=>{
    const node=inputRef.current;
    const viewport=viewportRef.current;
    const label=textRef.current;
    if(!node||!viewport||!label)return;
    const measure=()=>{
      const active=Boolean(placeholder)&&node.value.length===0;
      setIsEmpty(active);
      const width=viewport.clientWidth;
      const style=window.getComputedStyle(node);
      viewport.style.font=style.font;
      viewport.style.letterSpacing=style.letterSpacing;
      viewport.style.paddingInlineStart=style.paddingInlineStart;
      viewport.style.paddingInlineEnd=style.paddingInlineEnd;
      viewport.style.color=style.color;
      viewport.style.opacity='0.56';
      const textWidth=label.scrollWidth;
      setOverflow(active&&width>0?Math.max(0,Math.ceil(textWidth-width+2)):0);
    };
    measure();
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
    if(observer){observer.observe(node);observer.observe(viewport);observer.observe(label)}
    return()=>observer?.disconnect();
  },[placeholder,value,defaultValue]);
  const animate=overflow>2&&isEmpty&&!focus;
  return <span className={'marquee-input-wrap'+(animate?' marquee-input-active':'')} style={style&&style.width?{width:style.width}:undefined}>
    <input {...rest} ref={assignRef} className={className} style={style} placeholder={placeholder}
      value={value} defaultValue={defaultValue}
      onFocus={e=>{setFocus(true);onFocus?.(e)}}
      onBlur={e=>{setFocus(false);onBlur?.(e)}}
      onInput={e=>{setIsEmpty(e.currentTarget.value.length===0);rest.onInput?.(e)}}/>
    <span ref={viewportRef} className="marquee-placeholder-viewport" aria-hidden="true">
      <span ref={textRef} className="marquee-placeholder-text" style={{'--marquee-distance':`${overflow}px`,'--marquee-duration':`${Math.max(5,overflow/22+3).toFixed(2)}s`}}>{placeholder}</span>
    </span>
  </span>;
});
export default MarqueeInput;
