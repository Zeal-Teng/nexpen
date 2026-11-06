// Normalized, public closing prices only. No account or holdings data leaves the device.
export const rocDate=raw=>{
 const s=String(raw??'').trim().replace(/[\/-]/g,'');
 const normalized=/^\d{7}$/.test(s)?`${Number(s.slice(0,3))+1911}${s.slice(3)}`:s;
 if(!/^\d{8}$/.test(normalized))return '';
 const y=Number(normalized.slice(0,4)),m=Number(normalized.slice(4,6)),d=Number(normalized.slice(6,8));
 const date=new Date(Date.UTC(y,m-1,d));
 if(date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)return '';
 return `${normalized.slice(0,4)}-${normalized.slice(4,6)}-${normalized.slice(6,8)}`;
};
export function normalizeQuoteChange(raw, signMarker=null){
 if(raw===null||raw===undefined||String(raw).trim()==='')return null;
 const removeTags=value=>String(value).replace(/<[^>]*>/g,'').replaceAll('&minus;','−').replaceAll('&plus;','+').trim();
 const signText=signMarker==null?'':removeTags(signMarker).replace(/[－−﹣]/g,'-').replace(/[＋﹢]/g,'+');
 const text=removeTags(raw).replaceAll(',','').replace(/[＋﹢]/g,'+').replace(/[－−﹣]/g,'-');
 const down=/^[▼▽↓-]/.test(signText)||/^[▼▽↓]/.test(text);
 const up=/^[▲△↑+]/.test(signText)||/^[▲△↑]/.test(text);
 const cleaned=text.replace(/^[▲△↑▼▽↓]/,'').trim();
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned))return null;
 const value=Number(cleaned);
 return down?-Math.abs(value):up?Math.abs(value):value;
}
export function normalizeQuoteRows(rows,market){
 if(!Array.isArray(rows))throw Error('行情 JSON 格式錯誤');
 const out={};
 for(const row of rows){
  const code=String(market==='twse'?row.Code:row.SecuritiesCompanyCode??row.Code??'').trim().toUpperCase();
  if(!/^[0-9A-Z]{4,8}$/.test(code))continue;
  const raw=String(market==='twse'?row.ClosingPrice:row.Close??row.ClosingPrice??'').replaceAll(',','').trim();
  const price=Number(raw),date=rocDate(row.Date);
  if(!raw||!Number.isFinite(price)||price<=0||!date)continue;
  const change=normalizeQuoteChange(row.Change??row.change??row.PriceChange??row.Difference,row.ChangeSign??row.UpDown??row.ChangeType);
  const item={price,date,source:market==='twse'?'證交所（上市）':'櫃買中心（上櫃）',...(change===null?{}:{change})};
  if(!out[code]||item.date>=out[code].date)out[code]=item;
 }
 return out;
}
export function validateQuoteBundle(bundle){
 if(bundle?.format!=='cyberpulse-market-quotes-v1'||typeof bundle.quotes!=='object'||!bundle.quotes)throw Error('行情檔尚未建立或資料格式錯誤');
 const out={};
 for(const [code,q] of Object.entries(bundle.quotes)){
  const price=Number(q?.price),date=rocDate(q?.date);
  if(!/^[0-9A-Z]{4,8}$/.test(code)||!Number.isFinite(price)||price<=0||!date)continue;
  const change=normalizeQuoteChange(q.change);
  out[code]={price,date,source:String(q.source||'官方收盤行情'),...(change===null?{}:{change})};
 }
 return out;
}

// Market availability is supplied by the deployment job, not inferred from today's calendar date.
export function quoteMarketStatus(bundle){
 const result={};
 for(const market of ['twse','tpex']){
  const entry=bundle?.markets?.[market];
  if(!entry)continue;
  result[market]={status:entry.status==='cached'?'cached':entry.status==='updated'?'updated':'unknown',date:rocDate(entry.latestDate),count:Number(entry.count)||0};
 }
 return result;
}
