import {useEffect,useRef,useState} from 'react';
import {db,today} from './db.js';

// The history uses TWD base values. A day is updated as the ledger or market
// quote changes; old days are never rebuilt from today's prices.
export function useNetWorthHistory(ready,netWorthData){
 const [history,setHistory]=useState([]);
 const lastWritten=useRef('');
 const latest=useRef(netWorthData);
 latest.current=netWorthData;
 const fingerprint=JSON.stringify({net:netWorthData.netWorth,assets:netWorthData.totalAssets,liabilities:netWorthData.totalLiabilities,missing:netWorthData.missingQuotes});
 useEffect(()=>{
  if(!ready)return;
  let active=true;
  let sequence=Promise.resolve();
  const record=()=>{
   const data=latest.current;
   if(!data || !Number.isFinite(data.netWorth))return;
   const date=today();
   const signature=JSON.stringify([date,data.netWorth,data.totalAssets,data.totalLiabilities,data.missingQuotes]);
   if(lastWritten.current===signature)return;
   lastWritten.current=signature;
   sequence=sequence.then(async()=>{
    await db.netWorthHistory.put({date,netWorth:data.netWorth,totalAssets:data.totalAssets,totalLiabilities:data.totalLiabilities,complete:data.missingQuotes.length===0,capturedAt:new Date().toISOString()});
    const entries=await db.netWorthHistory.orderBy('date').toArray();
    if(active)setHistory(entries);
   }).catch(error=>{lastWritten.current='';console.error('淨資產每日記錄失敗',error);});
  };
  record();
  const onResume=()=>{if(document.visibilityState==='visible')record();};
  document.addEventListener('visibilitychange',onResume);
  window.addEventListener('focus',record);
  return ()=>{active=false;document.removeEventListener('visibilitychange',onResume);window.removeEventListener('focus',record)};
 },[ready,fingerprint]);
 return history;
}
