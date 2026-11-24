import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {registerSW} from 'virtual:pwa-register';
import {t} from './i18n.js';
import './pwa-update-dialog.css';

const BUILD_ID=__NEXPEN_BUILD_ID__;
const BUILD_TIME=__NEXPEN_BUILD_TIME__;
const UPDATE_EVENT='nexpen:check-update';
const EDITOR_SELECTORS=[
  '.modal-backdrop .sheet','.investment-product-backdrop','.investment-modal-backdrop',
  '.cp-pin-backdrop','.app-pin-wizard','.picker-sheet','.nexpen-confirm-overlay',
  '.transaction-category-backdrop','.investment-action-backdrop','.transaction-template-name-dialog',
  '[role="dialog"][aria-modal="true"]'
].join(',');
export function hasOpenEditor(doc=document){return !!doc.querySelector(EDITOR_SELECTORS)}
export function requestPwaUpdateCheck(){window.dispatchEvent(new Event(UPDATE_EVENT))}
export const pwaBuildInfo={version:'v355',buildId:BUILD_ID,buildTime:BUILD_TIME};

// A waiting worker stays inactive until the user explicitly agrees to update.
// Do not interrupt an open editor; defer the announcement until it closes.
export default function PwaUpdateManager(){
  const registration=useRef(null);
  const updateSWRef=useRef(null);
  const checking=useRef(false);
  const activating=useRef(false);
  const pending=useRef(false);
  const dismissedBuild=useRef(null);
  const remoteBuild=useRef(null);
  const [showPrompt,setShowPrompt]=useState(false);
  const [busy,setBusy]=useState(false);

  const offerWhenSafe=useCallback(()=>{
    if(!pending.current||activating.current||hasOpenEditor())return;
    if(dismissedBuild.current && dismissedBuild.current===(remoteBuild.current||'waiting'))return;
    if(registration.current?.waiting)setShowPrompt(true);
  },[]);

  const check=useCallback(async()=>{
    if(!navigator.onLine||checking.current||activating.current)return;
    checking.current=true;
    try{
      const response=await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`,{
        cache:'no-store',headers:{'Cache-Control':'no-cache'}
      });
      if(!response.ok)throw Error(`Version request ${response.status}`);
      const remote=await response.json();
      if(remote?.buildId&&remote.buildId!==BUILD_ID){
        remoteBuild.current=remote.buildId;
        await registration.current?.update();
        if(registration.current?.waiting){pending.current=true;offerWhenSafe()}
      }
    }catch(error){console.warn('[NEXPEN] update check failed',error)}
    finally{checking.current=false}
  },[offerWhenSafe]);

  const installUpdate=useCallback(async()=>{
    if(activating.current||!updateSWRef.current)return;
    if(hasOpenEditor())return; // Never discard an in-progress edit.
    activating.current=true;
    setBusy(true);
    try{await updateSWRef.current(true)}
    catch(error){
      console.warn('[NEXPEN] update activation failed',error);
      activating.current=false;
      setBusy(false);
    }
  },[]);

  useEffect(()=>{
    let active=true;
    updateSWRef.current=registerSW({
      immediate:true,
      onNeedRefresh(){
        if(!active)return;
        pending.current=true;
        offerWhenSafe();
      },
      onRegisteredSW(_url,reg){
        if(!active)return;
        registration.current=reg;
        if(reg?.waiting)pending.current=true;
        offerWhenSafe();
        void check();
      },
      onRegisterError(error){console.warn('[NEXPEN] SW registration failed',error)}
    });
    void check();
    const onResume=()=>{
      if(document.visibilityState==='hidden')return;
      offerWhenSafe();
      void check();
    };
    const observer=new MutationObserver(()=>{if(pending.current)offerWhenSafe()});
    observer.observe(document.body,{subtree:true,childList:true});
    const interval=window.setInterval(onResume,60*1000);
    window.addEventListener(UPDATE_EVENT,onResume);
    window.addEventListener('focus',onResume);
    window.addEventListener('online',onResume);
    document.addEventListener('visibilitychange',onResume);
    return()=>{
      active=false;observer.disconnect();window.clearInterval(interval);
      window.removeEventListener(UPDATE_EVENT,onResume);
      window.removeEventListener('focus',onResume);
      window.removeEventListener('online',onResume);
      document.removeEventListener('visibilitychange',onResume);
    };
  },[offerWhenSafe,check]);

  return showPrompt?createPortal(
    <div className="nexpen-update-overlay">
      <section role="alertdialog" aria-modal="true" aria-labelledby="nexpen-update-title" aria-describedby="nexpen-update-description" className="nexpen-update-dialog">
        <h2 id="nexpen-update-title">{t('發現新版本')}</h2>
        <p id="nexpen-update-description">{t('NEXPEN 有新版本可用，要立即更新嗎？')}</p>
        <div className="nexpen-update-actions">
          <button type="button" className="nexpen-update-later" disabled={busy} onClick={()=>{
            dismissedBuild.current=remoteBuild.current||'waiting';setShowPrompt(false);
          }}>{t('稍後更新')}</button>
          <button type="button" className="nexpen-update-now" disabled={busy} onClick={installUpdate}>{busy?t('更新中…'):t('立即更新')}</button>
        </div>
      </section>
    </div>,document.body
  ):null;
}
