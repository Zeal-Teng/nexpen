import React,{useEffect,useState} from 'react';
import {Download,Share2,X} from 'lucide-react';

/** A user-initiated install guide. Browsers never permit a site to silently install itself. */
export default function InstallHint({language='zh-TW'}){
 const [promptEvent,setPromptEvent]=useState(null);
 const [mode,setMode]=useState(null);
 const [dismissed,setDismissed]=useState(false);
 useEffect(()=>{
  if(typeof window==='undefined')return;
  const installed=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(installed())return;
  try{if(Date.now()-Number(localStorage.getItem('nexpen-install-hint-dismissed')||0)<7*86400000)return;}catch{}
  const ua=navigator.userAgent||'';
  const ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const android=/Android/i.test(ua);
  if(ios)setMode('ios');
  else if(android)setMode('android');
  const onPrompt=e=>{e.preventDefault();setPromptEvent(e);setMode('android');};
  const onInstalled=()=>{setMode(null);setPromptEvent(null);};
  window.addEventListener('beforeinstallprompt',onPrompt);
  window.addEventListener('appinstalled',onInstalled);
  return ()=>{window.removeEventListener('beforeinstallprompt',onPrompt);window.removeEventListener('appinstalled',onInstalled)};
 },[]);
 const close=()=>{setDismissed(true);try{localStorage.setItem('nexpen-install-hint-dismissed',String(Date.now()))}catch{}};
 const onInstall=async()=>{
  if(!promptEvent)return;
  try{await promptEvent.prompt();await promptEvent.userChoice;}catch{}
  setPromptEvent(null);
  close();
 };
 if(!mode||dismissed)return null;
 const en=language==='en';
 const zhCN=language==='zh-CN';
 const ja=language==='ja';
 const heading=en?'Install NEXPEN':ja?'NEXPENをホーム画面に追加':zhCN?'将 NEXPEN 添加到主屏幕':'將 NEXPEN 加入主畫面';
 const iosText=en?'On iPhone, tap Share in Safari, then Add to Home Screen.':ja?'iPhoneのSafariで共有をタップし、「ホーム画面に追加」を選択してください。':zhCN?'iPhone 请在 Safari 点「分享」→「加入主屏幕」。':'iPhone 請在 Safari 點「分享」→「加入主畫面」。';
 const androidText=en?'Use your browser menu and choose Install app or Add to Home screen.':ja?'ブラウザーのメニューから「アプリをインストール」または「ホーム画面に追加」を選択。':zhCN?'请从浏览器菜单选择「安装应用」或「添加到主屏幕」。':'請從瀏覽器選單選擇「安裝應用程式」或「加入主畫面」。';
 return <aside className="nexpen-install-hint" role="region" aria-label={heading}>
  <div className="nexpen-install-symbol">{mode==='ios'?<Share2 size={19}/>:<Download size={19}/>}</div>
  <div className="nexpen-install-copy"><strong>{heading}</strong><small>{mode==='ios'?iosText:androidText}</small></div>
  {mode==='android'&&promptEvent&&<button type="button" className="nexpen-install-action" onClick={onInstall}>{en?'Install':ja?'インストール':zhCN?'安装':'安裝'}</button>}
  <button type="button" className="nexpen-install-dismiss" onClick={close} aria-label={en?'Dismiss':'關閉'}><X size={18}/></button>
 </aside>;
}
