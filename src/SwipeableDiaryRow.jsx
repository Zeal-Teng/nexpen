import React, {useEffect, useRef} from 'react';
import {Pencil, Trash2} from 'lucide-react';

// Swiping to the fully labelled action and releasing triggers it immediately.
// The action is NOT triggered by merely crossing the threshold while still dragging.
export const SWIPE_REVEAL_PX = 108;
export const SWIPE_COMMIT_PX = 82;
const INTENT_PX = 8;
export function swipeSideForDistance(distance) {
  return distance >= SWIPE_COMMIT_PX ? 'edit' : distance <= -SWIPE_COMMIT_PX ? 'delete' : null;
}

export default function SwipeableDiaryRow({children, id, onEdit, onDelete, editLabel, deleteLabel}) {
  const surfaceRef = useRef(null);
  const gestureRef = useRef(null);
  const callbacksRef = useRef({onEdit,onDelete});
  callbacksRef.current = {onEdit,onDelete};
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef(null);

  function position(value, animate=true) {
    const node=surfaceRef.current;
    if(!node)return;
    node.style.transition = animate ? '' : 'none';
    node.style.transform = `translate3d(${value}px,0,0)`;
  }
  function suppressNextClick(){
    suppressClickRef.current=true;
    if(suppressTimerRef.current)clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current=setTimeout(()=>{suppressClickRef.current=false;},650);
  }
  useEffect(()=>{
    const node=surfaceRef.current;
    if(!node)return;
    let pendingAction=null;
    function start(x,y,input){
      if(pendingAction)return;
      gestureRef.current={x,y,lastX:x,lastY:y,axis:null,input};
    }
    function move(x,y,event){
      const g=gestureRef.current;
      if(!g)return;
      const dx=x-g.x,dy=y-g.y;
      g.lastX=x;g.lastY=y;
      if(!g.axis){
        if(Math.abs(dx)<INTENT_PX&&Math.abs(dy)<INTENT_PX)return;
        g.axis=Math.abs(dx)>Math.abs(dy)*1.16?'horizontal':'vertical';
        if(g.axis==='vertical'){gestureRef.current=null;return;}
      }
      if(g.axis!=='horizontal')return;
      if(event?.cancelable)event.preventDefault();
      position(Math.max(-SWIPE_REVEAL_PX,Math.min(SWIPE_REVEAL_PX,dx)),false);
    }
    function finish(cancelled=false){
      const g=gestureRef.current;
      gestureRef.current=null;
      if(!g)return;
      if(g.axis!=='horizontal'){position(0);return;}
      suppressNextClick();
      const dx=g.lastX-g.x;
      const side=cancelled?null:swipeSideForDistance(dx);
      if(!side){position(0);return;}
      // Show the entire action (and its text) before opening edit / confirmation.
      position(side==='edit'?SWIPE_REVEAL_PX:-SWIPE_REVEAL_PX);
      pendingAction=side;
      const fire=()=>{
        if(pendingAction!==side)return;
        pendingAction=null;
        position(0);
        if(side==='edit')callbacksRef.current.onEdit?.();
        else callbacksRef.current.onDelete?.(); // Existing confirmation stays in App.remove.
      };
      // Give the 108px reveal a brief, visible snap before the action opens.
      setTimeout(fire,145);
    }
    const touchstart=e=>{if(e.touches.length===1)start(e.touches[0].clientX,e.touches[0].clientY,'touch');};
    const touchmove=e=>{if(gestureRef.current?.input==='touch'&&e.touches.length===1)move(e.touches[0].clientX,e.touches[0].clientY,e);};
    const touchend=e=>{const g=gestureRef.current;if(g?.input!=='touch')return;if(e.changedTouches.length){g.lastX=e.changedTouches[0].clientX;g.lastY=e.changedTouches[0].clientY;}finish();};
    const touchcancel=()=>{if(gestureRef.current?.input==='touch')finish(true);};
    const pointerdown=e=>{if(e.pointerType==='mouse'&&e.button===0)start(e.clientX,e.clientY,'mouse');};
    const pointermove=e=>{if(gestureRef.current?.input==='mouse')move(e.clientX,e.clientY,e);};
    const pointerup=e=>{if(gestureRef.current?.input==='mouse'){gestureRef.current.lastX=e.clientX;finish();}};
    const mousecancel=()=>{if(gestureRef.current?.input==='mouse')finish(true);};
    node.addEventListener('touchstart',touchstart,{passive:true});
    node.addEventListener('touchmove',touchmove,{passive:false});
    node.addEventListener('touchend',touchend,{passive:true});
    node.addEventListener('touchcancel',touchcancel,{passive:true});
    node.addEventListener('pointerdown',pointerdown);
    node.addEventListener('pointermove',pointermove);
    node.addEventListener('pointerup',pointerup);
    node.addEventListener('pointercancel',mousecancel);
    node.addEventListener('mouseleave',mousecancel);
    return ()=>{
      node.removeEventListener('touchstart',touchstart);
      node.removeEventListener('touchmove',touchmove);
      node.removeEventListener('touchend',touchend);
      node.removeEventListener('touchcancel',touchcancel);
      node.removeEventListener('pointerdown',pointerdown);
      node.removeEventListener('pointermove',pointermove);
      node.removeEventListener('pointerup',pointerup);
      node.removeEventListener('pointercancel',mousecancel);
      node.removeEventListener('mouseleave',mousecancel);
      pendingAction=null;
    };
  },[id]);
  useEffect(()=>()=>{if(suppressTimerRef.current)clearTimeout(suppressTimerRef.current);},[]);
  const suppressClick=e=>{if(suppressClickRef.current){e.preventDefault();e.stopPropagation();}};
  return <div className="diary-swipe-container" data-swipe-id={id}>
    <div className="diary-swipe-actions" aria-hidden="true">
      <div className="diary-swipe-reveal-action diary-swipe-edit"><Pencil size={23}/><span>{editLabel}</span></div>
      <div className="diary-swipe-reveal-action diary-swipe-delete"><Trash2 size={23}/><span>{deleteLabel}</span></div>
    </div>
    <div ref={surfaceRef} className="diary-swipe-surface" onClickCapture={suppressClick}>{children}</div>
  </div>;
}
