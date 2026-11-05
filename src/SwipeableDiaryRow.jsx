import React, {useEffect, useRef} from 'react';
import {Edit3, Trash2} from 'lucide-react';

// Mobile-friendly swipe-to-reveal: swipe left for Delete, right for Edit.
// Keeping the actions behind the row prevents accidental destructive gestures.
const REVEAL = 84;
const COMMIT_THRESHOLD = 49;
const INTENT_THRESHOLD = 9;

export default function SwipeableDiaryRow({children, id, openSide, onReveal, onEdit, onDelete, editLabel, deleteLabel}) {
  const card = useRef(null);
  const gesture = useRef(null);
  const blockClick = useRef(false);
  const resetTimer = useRef(null);
  const offset = openSide === 'edit' ? REVEAL : openSide === 'delete' ? -REVEAL : 0;

  function position(value, animate = true) {
    if (!card.current) return;
    card.current.style.transition = animate ? '' : 'none';
    card.current.style.transform = `translate3d(${value}px,0,0)`;
  }
  useEffect(() => {
    if (!gesture.current) position(offset);
  }, [offset]);
  useEffect(() => () => {if(resetTimer.current)clearTimeout(resetTimer.current)}, []);

  function start(e) {
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    if(e.target.closest('.diary-swipe-reveal-action')) return;
    gesture.current = {pointerId:e.pointerId,x:e.clientX,y:e.clientY,origin:offset,axis:null,moved:false};
  }
  function move(e) {
    const g=gesture.current;
    if(!g || g.pointerId !== e.pointerId) return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!g.axis) {
      if(Math.abs(dx)<INTENT_THRESHOLD && Math.abs(dy)<INTENT_THRESHOLD) return;
      g.axis = Math.abs(dx)>Math.abs(dy)*1.25 ? 'horizontal' : 'vertical';
      if(g.axis==='vertical') {gesture.current=null;return;}
      try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
    }
    if(g.axis!=='horizontal') return;
    g.moved=true;
    const next = Math.max(-REVEAL,Math.min(REVEAL,g.origin+dx));
    position(next,false);
  }
  function end(e, cancelled=false) {
    const g=gesture.current;
    if(!g || (e && g.pointerId!==e.pointerId)) return;
    gesture.current=null;
    if(g.axis==='horizontal' && g.moved) {
      blockClick.current=true;
      if(resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current=setTimeout(()=>{blockClick.current=false},350);
      const displacement=cancelled ? g.origin : Math.max(-REVEAL,Math.min(REVEAL,g.origin+(e.clientX-g.x)));
      const newSide = cancelled ? openSide : displacement>=COMMIT_THRESHOLD ? 'edit' : displacement<=-COMMIT_THRESHOLD ? 'delete' : null;
      onReveal(newSide);
      position(newSide==='edit'?REVEAL:newSide==='delete'?-REVEAL:0);
    } else if(cancelled) position(offset);
  }
  function handleContentClick(e) {
    if(blockClick.current || openSide) {
      e.preventDefault();e.stopPropagation();
      blockClick.current=false;
      if(openSide){onReveal(null);position(0)}
    }
  }
  function perform(action) {
    onReveal(null);
    position(0);
    (action==='edit'?onEdit:onDelete)();
  }
  return <div className={'diary-swipe-container'+(openSide?' has-reveal':'')} data-swipe-id={id}>
    <div className="diary-swipe-actions" aria-hidden={!openSide}>
      <button type="button" className="diary-swipe-reveal-action diary-swipe-edit" tabIndex={openSide==='edit'?0:-1} aria-label={editLabel} onClick={()=>perform('edit')}><Edit3 size={21}/><span>{editLabel}</span></button>
      <button type="button" className="diary-swipe-reveal-action diary-swipe-delete" tabIndex={openSide==='delete'?0:-1} aria-label={deleteLabel} onClick={()=>perform('delete')}><Trash2 size={21}/><span>{deleteLabel}</span></button>
    </div>
    <div ref={card} className="diary-swipe-surface" style={{transform:`translate3d(${offset}px,0,0)`}} onPointerDown={start} onPointerMove={move} onPointerUp={e=>end(e)} onPointerCancel={e=>end(e,true)} onLostPointerCapture={e=>{if(gesture.current?.pointerId===e.pointerId)end(e,true)}} onClickCapture={handleContentClick}>{children}</div>
  </div>;
}
