import React, {useCallback,useEffect,useRef,useState} from 'react';
import {registerSW} from 'virtual:pwa-register';
import './pwa-update.css';

const BUILD_ID=__NEXPEN_BUILD_ID__;
const BUILD_TIME=__NEXPEN_BUILD_TIME__;
const UPDATE_EVENT='nexpen:check-update';
const EDITOR_SELECTORS=[
  '.modal-backdrop .sheet', '.investment-product-backdrop', '.investment-modal-backdrop',
  '.cp-pin-backdrop', '.app-pin-wizard', '.picker-sheet', '.nexpen-confirm-overlay',
  '.transaction-category-backdrop', '.investment-action-backdrop', '.transaction-template-name-dialog'
].join(',');
export function hasOpenEditor(doc=document){return !!doc.querySelector(EDITOR_SELECTORS)}
export function requestPwaUpdateCheck(){window.dispatchEvent(new Event(UPDATE_EVENT))}
export const pwaBuildInfo={version:'v284',buildId:BUILD_ID,buildTime:BUILD_TIME};

export default function PwaUpdateManager(){
  const [available,setAvailable]=useState(false);
  const [checking,setChecking]=useState(false);
  const [message,setMessage]=useState('');
  const updateSWRef=useRef(null);
  const regRef=useRef(null);
  const inFlight=useRef(false);
  const bootUntil=useRef(Date.now()+12000);
  const latestRef=useRef('');
  useEffect(()=>{
    if(!message||available)return;
    const timeout=window.setTimeout(()=>setMessage(''),3500);
    return()=>window.clearTimeout(timeout);
  },[message,available]);

  const activate=useCallback(async()=>{
    if(hasOpenEditor()){
      setMessage('請先儲存或關閉目前的編輯視窗，再按「立即更新」。');
      setAvailable(true);
      return;
    }
    setMessage('正在安裝新版…');
    try{
      const updater=updateSWRef.current;
      if(regRef.current?.waiting && updater){await updater(true);return;}
      // When the new files are deployed before the new worker has reached waiting,
      // do not reload into the old worker: request a worker check instead.
      if(regRef.current){await regRef.current.update()}
      if(regRef.current?.waiting && updater){await updater(true);return;}
      setMessage('新版已發現，正在下載更新。請稍後再按一次「立即更新」。');
    }catch(e){setMessage('更新未完成，請確認網路連線後重試。');console.warn('[NEXPEN] SW update failed',e)}
  },[]);

  const showNewVersion=useCallback(()=>{
    setAvailable(true);
    if(Date.now()<=bootUntil.current && !hasOpenEditor()){
      // On a fresh app launch, activate the waiting worker without asking.
      if(!inFlight.current){inFlight.current=true;Promise.resolve().then(()=>updateSWRef.current?.(true)).catch(()=>setMessage('自動更新失敗，請按「立即更新」。')).finally(()=>{inFlight.current=false})}
    }
  },[]);

  const check=useCallback(async(manual=false)=>{
    if(!navigator.onLine){if(manual)setMessage('目前離線，連線後可重新檢查更新。');return}
    if(inFlight.current)return;
    inFlight.current=true;setChecking(true);
    try{
      // This JSON is deliberately not precached. It detects a new deployment even
      // when the currently loaded app shell is served by an older service worker.
      const url=`${import.meta.env.BASE_URL}version.json`;
      const response=await fetch(url,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      if(!response.ok)throw Error('version endpoint unavailable');
      const data=await response.json();
      if(typeof data.buildId!=='string'||!data.buildId)throw Error('invalid version');
      if(data.buildId!==BUILD_ID){
        latestRef.current=data.buildId;setAvailable(true);
        await regRef.current?.update();
        if(Date.now()<=bootUntil.current && regRef.current?.waiting && !hasOpenEditor()){
          await updateSWRef.current?.(true);
        }
        if(manual)setMessage('已有新版可用，請按「立即更新」。');
      }else if(manual){setMessage('目前已是最新版本。')}
    }catch(e){if(manual)setMessage('無法取得版本資訊，請確認 GitHub Pages 部署及網路連線。');console.warn('[NEXPEN] update check',e)}
    finally{inFlight.current=false;setChecking(false)}
  },[]);

  useEffect(()=>{
    let mounted=true;
    const updateSW=registerSW({
      immediate:true,
      onNeedRefresh(){if(mounted)showNewVersion()},
      onRegisteredSW(_url,registration){
        if(!mounted)return;
        regRef.current=registration;
        if(registration?.waiting)showNewVersion();
        void check();
      },
      onRegisterError(error){console.warn('[NEXPEN] SW registration failed',error)}
    });
    updateSWRef.current=updateSW;
    // In browsers without SW support, still report the published version.
    void check();
    const onManual=()=>void check(true);
    const onResume=()=>{if(document.visibilityState==='visible')void check()};
    window.addEventListener(UPDATE_EVENT,onManual);
    window.addEventListener('focus',onResume);
    window.addEventListener('online',onResume);
    document.addEventListener('visibilitychange',onResume);
    const periodic=window.setInterval(()=>{if(document.visibilityState==='visible')void check()},15*60*1000);
    return()=>{mounted=false;window.clearInterval(periodic);window.removeEventListener(UPDATE_EVENT,onManual);window.removeEventListener('focus',onResume);window.removeEventListener('online',onResume);document.removeEventListener('visibilitychange',onResume)};
  },[check,showNewVersion]);

  return <>
    {available&&<aside className="nexpen-update-banner" role="status" aria-live="polite">
      <strong>發現 NEXPEN 新版本</strong>
      <span>{message||'新版已發布；更新不會清除本機記帳資料。編輯中的內容請先儲存。'}</span>
      <div className="nexpen-update-actions">
        <button type="button" onClick={()=>{setAvailable(false);setMessage('')}}>稍後</button>
        <button type="button" className="nexpen-update-primary" onClick={()=>void activate()}>立即更新</button>
      </div>
    </aside>}
    {!available&&message&&<div className="nexpen-update-notice" role="status" onClick={()=>setMessage('')}>{message}</div>}
  </>;
}
