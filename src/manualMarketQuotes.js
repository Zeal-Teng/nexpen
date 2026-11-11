import { normalizeQuoteRows, validateQuoteBundle, rocDate, normalizeQuoteChange } from './marketQuotes.js';
export const OFFICIAL_QUOTES={twse:'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',tpex:'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes'};
export async function fetchQuoteJson(url,fetcher=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{const response=await fetcher(`${url}${url.includes('?')?'&':'?'}_=${Date.now()}`,{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}`);return await response.json();}finally{clearTimeout(timer);}
}
export const HISTORY_QUOTES={twse:'https://www.twse.com.tw/exchangeReport/MI_INDEX',tpex:'https://www.tpex.org.tw/www/zh-tw/afterTrading/dailyQuotes'};
export function historyUrl(market,date,dev=false){const base=dev?`/api/history/${market}`:HISTORY_QUOTES[market];return `${base}?${market==='twse'?`response=json&date=${date.replaceAll('-','')}&type=ALLBUT0999`:`date=${encodeURIComponent(date.replaceAll('-','/'))}&response=json`}`;}
export function parseDatedQuotes(payload,market,date){
 const reported=rocDate(payload?.date??payload?.Date);if(!payload||typeof payload!=='object'||(market==='twse'&&payload.stat!=='OK')||(market==='tpex'&&reported!==date)||(reported&&reported!==date))return {};
 const tables=Array.isArray(payload.tables)?payload.tables:[];
 const candidates=market==='twse'?[...tables.filter(t=>String(t.title||'').includes('每日收盤行情')), ...['data9','data10','data11','data8'].map(k=>({data:payload[k]}))]:tables.slice(0,1);
 for(const t of candidates){const out={};for(const row of t.data||t.aaData||[]){if(!Array.isArray(row)||row.length<11)continue;const code=String(row[0]).trim().toUpperCase(),price=Number(String(row[market==='twse'?8:2]).replaceAll(',','').trim());if(!/^[0-9A-Z]{4,8}$/.test(code)||!Number.isFinite(price)||price<=0||price>=1000000)continue;const change=market==='twse'?normalizeQuoteChange(row[10],String(row[9]).includes('green')?'-':row[9]):normalizeQuoteChange(row[3]);out[code]={price,date,source:market==='twse'?'證交所（上市）':'櫃買中心（上櫃）',...(change===null?{}:{change})};}if(Object.keys(out).length)return out;}return {};
}
export async function collectClosingQuotes({codes,previous={},manual=false,dev=false,bundleUrl,fetcher=fetch,today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei'}).format(new Date())}){
 const wanted=new Set([...codes].filter(code=>!code.startsWith('US:'))),got={},origins={},errors=[];
 const mergeUS=(rows,origin)=>{for(const [code,q] of Object.entries(rows)){if(!codes.has(code)||q.date>today)continue;if(!got[code]||q.date>got[code].date||(q.date===got[code].date&&origin==='official')){got[code]=q;origins[code]=origin;}}};
 const merge=(rows,origin)=>{for(const [code,q] of Object.entries(rows)){if(!wanted.has(code)||q.date>today||q.price>=1000000)continue;if(!got[code]||q.date>got[code].date){got[code]=q;origins[code]=origin;}}};
 // Start US quotes immediately. Taiwanese historical endpoints can be slow or blocked
 // by browser CORS, and must not delay quote retrieval for US trusts.
 const usPromise=(async()=>{
  const usCodes=[...codes].filter(code=>code.startsWith('US:'));
  if(!usCodes.length)return;
  try {
   const base=bundleUrl?.replace(/market-quotes\.json(?:\?.*)?$/,'us-market-quotes.json');
   if(base){
    const payload=await fetchQuoteJson(base,fetcher),out={};
    for(const code of usCodes){
     const q=payload?.quotes?.[code];
     if(Number(q?.price)>0&&/^\d{4}-\d{2}-\d{2}$/.test(q?.date))out[code]={price:Number(q.price),date:q.date,source:'美股每日收盤價'};
    }
    mergeUS(out,'github');
   }
  }catch(e){errors.push('美股備援行情無法取得');}
  if(manual||usCodes.some(code=>!got[code])){
   await Promise.all(usCodes.filter(code=>manual||!got[code]).map(async code=>{
    const symbol=code.slice(3);
    for(const host of ['query1.finance.yahoo.com','query2.finance.yahoo.com']){
     try{
      const url=`https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=7d&interval=1d`;
      const raw=await fetchQuoteJson(url,fetcher),chart=raw?.chart?.result?.[0];
      const times=chart?.timestamp||[],closes=chart?.indicators?.quote?.[0]?.close||[];
      for(let i=times.length-1;i>=0;i--){
       const close=Number(closes[i]);
       if(close>0){
        const date=new Date(times[i]*1000).toLocaleDateString('sv-SE',{timeZone:'America/New_York'});
        const now=new Date(),nyDate=now.toLocaleDateString('sv-SE',{timeZone:'America/New_York'});
        const nyHour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',hour12:false}).format(now));
        if(date>today||(date===nyDate&&nyHour<17))continue;
        mergeUS({[code]:{price:close,date,source:'美股每日收盤價'}},'official');
        return;
       }
      }
     }catch(e){/* Another provider host may still work. */}
    }
   }));
  }
 })();
 if((manual||dev)&&wanted.size){
 await Promise.all(Object.keys(OFFICIAL_QUOTES).map(async market=>{let found=false;
 for(let offset=0;offset<10;offset++){const d=new Date(`${today}T00:00:00Z`);d.setUTCDate(d.getUTCDate()-offset);if([0,6].includes(d.getUTCDay()))continue;const date=d.toISOString().slice(0,10);try{const rows=parseDatedQuotes(await fetchQuoteJson(historyUrl(market,date,dev),fetcher),market,date);if(Object.keys(rows).length){merge(rows,'official');found=true;break;}}catch(e){errors.push(`${market} 指定日期行情無法取得`);break;}}
 // The latest endpoint supplements missing holdings, or a newer verified date.
 try{if([...wanted].every(code=>got[code])&&found)return;let raw=await fetchQuoteJson(dev?`/api/quotes/${market}`:OFFICIAL_QUOTES[market],fetcher);if(market==='twse'&&Array.isArray(raw)&&raw.some(r=>!rocDate(r.Date))){const meta=await fetchQuoteJson(dev?'/api/quotes/twse-date':'https://openapi.twse.com.tw/v1/exchangeReport/FMTQIK',fetcher);const date=Array.isArray(meta)?meta.map(r=>rocDate(r.Date)).filter(Boolean).sort().at(-1):null;if(!date)throw Error('無法確認交易日期');raw=raw.map(r=>({...r,Date:r.Date||date}));}merge(normalizeQuoteRows(raw,market),'official');}catch(e){errors.push(`${market} OpenAPI 無法取得`);}
 }));}
 if(bundleUrl&&(!dev||manual)){try{merge(validateQuoteBundle(await fetchQuoteJson(bundleUrl,fetcher)),'github');}catch(e){errors.push('GitHub 備援行情無法取得');}}

 await usPromise;

 return {got,origins,errors};
}
export function mergeClosingQuotes(previous,got,origins,codes){
 const merged={...previous};let official=0,github=0,unchanged=0,failed=0;
 for(const code of codes){const q=got[code],old=previous[code];if(!q){failed++;continue;}
  if(old?.date>q.date||(old?.date===q.date&&Number(old.price)===q.price&&old.change===q.change)){unchanged++;continue;}
  merged[code]=q;if(origins[code]==='official')official++;else github++;
 }
 return {merged,official,github,unchanged,failed};
}
