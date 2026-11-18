import {useCallback,useEffect,useRef} from 'react';
import {registerSW} from 'virtual:pwa-register';

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
export const pwaBuildInfo={version:'v335',buildId:BUILD_ID,buildTime:BUILD_TIME};

// The worker is downloaded silently. Never replace an open editor or an in-progress
// form; when the user returns to the app after closing it, activate the waiting SW.
export default function PwaUpdateManager(){
  const registration=useRef(null);
  const updateSW=useRef(null);
  const checking=useRef(false);
  const activating=useRef(false);
  const pending=useRef(false);

  const activateWhenSafe=useCallback(async()=>{
    if(!pending.current||activating.current||hasOpenEditor())return;
    const reg=registration.current;
    if(!reg?.waiting||!updateSW.current)return;
    activating.current=true;
    try{
      await updateSW.current(true); // activates waiting worker and reloads app
    }catch(error){
      activating.current=false;
      console.warn('[NEXPEN] silent update activation failed',error);
    }
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
        pending.current=true;
        await registration.current?.update();
        await activateWhenSafe();
      }
    }catch(error){console.warn('[NEXPEN] silent update check failed',error)}
    finally{checking.current=false}
  },[activateWhenSafe]);

  useEffect(()=>{
    let active=true;
    const updater=registerSW({
      immediate:true,
      onNeedRefresh(){
        if(!active)return;
        pending.current=true;
        void activateWhenSafe();
      },
      onRegisteredSW(_url,reg){
        if(!active)return;
        registration.current=reg;
        if(reg?.waiting)pending.current=true;
        void activateWhenSafe();
        void check();
      },
      onRegisterError(error){console.warn('[NEXPEN] SW registration failed',error)}
    });
    updateSW.current=updater;
    void check();
    const onResume=()=>{
      if(document.visibilityState==='hidden')return;
      void activateWhenSafe();
      void check();
    };
    const observer=new MutationObserver(()=>{if(pending.current)void activateWhenSafe()});
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
  },[activateWhenSafe,check]);
  return null; // no notification, banner, or action required
}
