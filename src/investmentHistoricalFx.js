/** Historical central-bank reference rates. Never use a post-transaction quotation. */
export async function fetchHistoricalInvestmentRate(base, quote, date, {signal,fetchImpl=fetch}={}) {
 const source=String(base||'').toUpperCase(), target=String(quote||'').toUpperCase();
 if(!/^[A-Z]{3}$/.test(source)||!/^[A-Z]{3}$/.test(target))throw Error('請選擇有效的幣別');
 if(source===target)return {rate:1,date,source:'same-currency'};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z')))throw Error('請選擇有效的交易或估值日期');
 const now=new Date().toISOString().slice(0,10);
 if(date>now)throw Error('無法取得未來日期的歷史匯率');
 const end=new Date(date+'T00:00:00Z');const start=new Date(end);start.setUTCDate(start.getUTCDate()-10);
 const from=start.toISOString().slice(0,10);
 const params=new URLSearchParams({from,to:date,base:source,quotes:target});
 const response=await fetchImpl(`https://api.frankfurter.dev/v2/rates?${params}`,{signal,cache:'no-store'});
 if(!response.ok)throw Error(`歷史匯率服務回應 ${response.status}`);
 const data=await response.json();
 if(!Array.isArray(data))throw Error('歷史匯率格式錯誤');
 const latest=data.filter(r=>r?.base?.toUpperCase()===source&&r?.quote?.toUpperCase()===target&&r.date<=date&&r.date>=from&&Number(r.rate)>0).sort((a,b)=>b.date.localeCompare(a.date))[0];
 if(!latest)throw Error('此日期之前沒有可用的歷史匯率，請手動輸入');
 return {rate:latest.rate,date:latest.date,source:'Frankfurter'};
}
