import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {AlertTriangle,Check,ShieldAlert,Trash2,Upload, X} from 'lucide-react';
import './confirm-dialog.css';
import {t} from './i18n.js';

// A single asynchronous confirmation contract, shared by all destructive and high-impact operations.
// Always resolve the promise on both confirm and dismiss; never keep a Dexie transaction
// open while waiting for user interaction.
const PRESETS={
 delete:{title:'確認刪除？',description:'刪除後無法直接復原。',confirmText:'確認刪除',icon:Trash2},
 restore:{title:'還原本機備份？',description:'目前本機資料將被備份內容覆蓋，請確認已留存需要的資料。',confirmText:'確認還原',icon:Upload},
 warning:{title:'請再次確認',description:'請確認操作條件後再繼續。',confirmText:'確認繼續',icon:AlertTriangle},
 confirm:{title:'確認操作？',description:'確認後將繼續執行此操作。',confirmText:'確認',icon:Check},
};
export function useConfirmDialog(){
 const [request,setRequest]=useState(null);
 const pending=useRef(null);
 const askConfirm=useCallback((options={})=>{
  // If another confirmation is pending, prevent an unresolved promise.
  if(pending.current)return Promise.resolve(false);
  return new Promise(resolve=>{
   pending.current=resolve;
   setRequest({kind:'confirm',...options});
  });
 },[]);
 const finish=useCallback(accepted=>{
  const resolve=pending.current;
  pending.current=null;
  setRequest(null);
  resolve?.(accepted);
 },[]);
 useEffect(()=>()=>{pending.current?.(false);pending.current=null;},[]);
 const dialog=request?<ConfirmDialogView request={request} onConfirm={()=>finish(true)} onCancel={()=>finish(false)}/>:null;
 return {askConfirm,confirmationDialog:dialog};
}
function ConfirmDialogView({request,onConfirm,onCancel}){
 const confirmRef=useRef(null),cancelRef=useRef(null),windowRef=useRef(null);
 const preset=PRESETS[request.kind]||PRESETS.confirm;
 const Icon=preset.icon;
 useEffect(()=>{
  const previous=document.activeElement;
  cancelRef.current?.focus();
  const onKeyDown=e=>{
   if(e.key==='Escape'){e.preventDefault();onCancel();}
   if(e.key==='Tab'){
    const elements=[...windowRef.current.querySelectorAll('button:not([disabled])')];
    if(!elements.length)return;
    const first=elements[0],last=elements[elements.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
  };
  document.addEventListener('keydown',onKeyDown);
  return ()=>{document.removeEventListener('keydown',onKeyDown);previous?.focus?.();};
 },[onCancel]);
 return createPortal(<div className="nexpen-confirm-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onCancel()}}>
  <section ref={windowRef} className={'nexpen-confirm-dialog tone-'+request.kind} role="alertdialog" aria-modal="true" aria-labelledby="nexpen-confirm-title" aria-describedby="nexpen-confirm-description">
   <div className="nexpen-confirm-heading"><span className="nexpen-confirm-icon"><Icon size={23}/></span><div className="nexpen-confirm-title-wrap"><h2 id="nexpen-confirm-title">{t(request.title||preset.title)}</h2>{request.subtitle&&<small>{t(request.subtitle)}</small>}</div><button type="button" className="nexpen-confirm-close" onClick={onCancel} aria-label={t('關閉')}><X size={18}/></button></div>
   <p id="nexpen-confirm-description">{t(request.description||preset.description)}</p>
   {request.details&&<div className="nexpen-confirm-details">{request.details}</div>}
   <div className="nexpen-confirm-actions"><button ref={cancelRef} type="button" className="nexpen-confirm-cancel" onClick={onCancel}>{t(request.cancelText||'取消')}</button><button ref={confirmRef} type="button" className="nexpen-confirm-submit" onClick={onConfirm}>{t(request.confirmText||preset.confirmText)}</button></div>
  </section>
 </div>,document.body);
}
