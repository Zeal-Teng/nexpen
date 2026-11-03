import { db } from './db';
// ISIN official listed/OTC catalog. No private holdings are sent to either ISIN site.
// GitHub Pages reads a same-origin JSON generated at deployment. Vite dev uses a local proxy.
const sectionType = heading => {
  const h = heading.replace(/\s/g,'');
  if(/權證|認購|認售|存託憑證|公司債|可轉換|受益證券|特別股|股款|期貨|選擇權/.test(h))return null;
  if(/ETF|指數股票型基金|交易所交易基金/.test(h))return 'etf';
  if(/股票/.test(h))return 'stock';
  return null;
};
export function parseIsinHtml(html,market){
  const doc = new DOMParser().parseFromString(html,'text/html');
  const out={};let section='';
  for(const row of doc.querySelectorAll('tr')){
    const cells=[...row.querySelectorAll('td')];
    if(cells.length===1){section=cells[0].textContent.trim();continue;}
    if(cells.length<3)continue;
    const kind=sectionType(section);
    if(!kind)continue;
    const combined=(cells[0].textContent||'').replace(/\u00a0/g,' ').trim();
    const m=/^([0-9A-Z]{4,8})[\s\u3000]+(.+)$/.exec(combined);
    if(!m)continue;
    const code=m[1].toUpperCase(),name=m[2].trim();
    if(!name||/有價證券代號/.test(name))continue;
    // Product section and code suffix are complementary; never infer an ETF from 00 alone.
    const bond=kind==='etf'&&(/(?:債券|債|公司債|公債)/.test(name)||/^[0-9]{5}[BCD]$/.test(code));
    out[code]={name,market,kind:bond?'bondEtf':kind,category:section};
  }
  return out;
}
// Catalog is public data; keep it outside financial JSON backup to avoid huge exports.
// The last successfully retrieved list remains usable offline.
const CACHE_KEY='official-security-catalog';
const REFRESH_MS=24*60*60*1000;
let memoryCatalog=null;
let catalogPromise=null;
let refreshPromise=null;
async function cachedCatalog(){
 if(memoryCatalog)return memoryCatalog;
 try{
  const item=await db.marketCache.get(CACHE_KEY);
  if(item?.securities && Object.keys(item.securities).length){
   memoryCatalog=item.securities;
   return memoryCatalog;
  }
 }catch(e){console.warn('股票名冊本機快取讀取失敗',e)}
 return null;
}
// Official TWSE close data includes Code + Name for listed stocks and listed ETFs.
// This supplements the ISIN HTML which can be incomplete or vary by market.
async function listedNamesFromQuotes(){
 const url=import.meta.env.DEV?'/api/quotes/twse':`${import.meta.env.BASE_URL}security-listed-fallback.json`;
 const response=await fetch(url,{cache:'no-store'});
 if(!response.ok)throw Error(`上市名稱備援 HTTP ${response.status}`);
 const body=await response.json();
 if(!import.meta.env.DEV){
  if(body.format!=='cyberpulse-listed-names-v1'||!body.securities)throw Error('上市名稱備援格式錯誤');
  return body.securities;
 }
 if(!Array.isArray(body))throw Error('上市行情名冊格式錯誤');
 const out={};
 for(const item of body){
  const code=String(item.Code||'').trim().toUpperCase();const name=String(item.Name||'').trim();
  if(!/^[0-9A-Z]{4,8}$/.test(code)||!name)continue;
  const isEtf=/^00[0-9A-Z]{2,6}$/.test(code);
  const kind=isEtf?(/(?:[BCD])$/.test(code)||/債券|美債|公債|公司債/.test(name)?'bondEtf':'etf'):'stock';
  out[code]={name,market:'twse',kind,category:'上市官方行情名稱'};
 }
 return out;
}
async function downloadCatalog(){
 if(import.meta.env.DEV){
  const results=await Promise.allSettled(['twse','tpex'].map(async market=>{
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);
   try{
    const res=await fetch(`/api/isin/${market}`,{cache:'no-store',signal:controller.signal});
    if(!res.ok)throw Error(`ISIN ${market} HTTP ${res.status}`);
    return parseIsinHtml(new TextDecoder('big5').decode(await res.arrayBuffer()),market);
   }finally{clearTimeout(timer)}
  }));
  const valid=results.filter(r=>r.status==='fulfilled'&&Object.keys(r.value).length).map(r=>r.value);
  let merged=Object.assign({},...valid);
  try{const names=await listedNamesFromQuotes();merged={...names,...merged}}catch(e){console.warn('上市名稱備援查詢失敗',e)}
  if(!Object.keys(merged).length)throw Error('上市及上櫃名冊均無法讀取');
  return merged;
 }
 const res=await fetch(`${import.meta.env.BASE_URL}security-catalog.json`,{cache:'no-store'});
 if(!res.ok)throw Error('尚未部署股票名冊，請重新執行 GitHub Pages 部署');
 const value=await res.json();
 if(value.format!=='cyberpulse-security-catalog-v1'||!value.securities||typeof value.securities!=='object'||!Object.keys(value.securities).length)
  throw Error('ISIN 名冊為空或格式不正確');
 let merged=value.securities;
 try{const names=await listedNamesFromQuotes();merged={...names,...merged}}catch(e){console.info('沿用已部署上市名冊：',e.message)}
 return merged;
}
export async function refreshSecurityCatalog({force=false}={}){
 if(refreshPromise)return refreshPromise;
 refreshPromise=(async()=>{
  const item=await db.marketCache.get(CACHE_KEY);
  if(!force&&item?.updatedAt&&Date.now()-item.updatedAt<REFRESH_MS&&Object.values(item.securities||{}).some(x=>x.market==='twse'))return {status:'fresh',count:Object.keys(item.securities||{}).length};
  const latest=await downloadCatalog();
  const merged={...(item?.securities||{}),...latest};
  await db.marketCache.put({key:CACHE_KEY,updatedAt:Date.now(),securities:merged});
  memoryCatalog=merged;
  return {status:'updated',count:Object.keys(merged).length};
 })().finally(()=>{refreshPromise=null});
 return refreshPromise;
}
export async function loadSecurityCatalog(){
 if(catalogPromise)return catalogPromise;
 catalogPromise=(async()=>{
  const local=await cachedCatalog();
  if(local)return local;
  await refreshSecurityCatalog({force:true});
  return memoryCatalog||{};
 })().catch(e=>{catalogPromise=null;throw e});
 return catalogPromise;
}
export async function lookupSecurity(code){
 const dict=await loadSecurityCatalog();
 return dict[String(code||'').trim().toUpperCase()]||null;
}
