// Normalized, public closing prices only. No account or holdings data leaves the device.
const rocDate=raw=>{
 const s=String(raw??'').trim();
 if(/^\d{7}$/.test(s))return `${Number(s.slice(0,3))+1911}-${s.slice(3,5)}-${s.slice(5,7)}`;
 if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
 return '';
};
export function normalizeQuoteRows(rows,market){
 if(!Array.isArray(rows))throw Error('行情 JSON 格式錯誤');
 const out={};
 for(const row of rows){
  const code=String(market==='twse'?row.Code:row.SecuritiesCompanyCode??row.Code??'').trim().toUpperCase();
  if(!/^[0-9A-Z]{4,8}$/.test(code))continue;
  const raw=String(market==='twse'?row.ClosingPrice:row.Close??row.ClosingPrice??'').replaceAll(',','').trim();
  const price=Number(raw),date=rocDate(row.Date);
  if(!raw||!Number.isFinite(price)||price<=0||!date)continue;
  const item={price,date,source:market==='twse'?'證交所（上市）':'櫃買中心（上櫃）'};
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
  out[code]={price,date,source:String(q.source||'官方收盤行情')};
 }
 return out;
}
