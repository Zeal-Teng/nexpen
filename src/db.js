import {calculateLots} from './stockLots.js';
import Dexie from 'dexie';
export const db = new Dexie('cyberpulse_liquid_v1');
db.version(1).stores({records:'id,date,type,account,mainCategory',accounts:'id,name,type',stocks:'id,date,symbol,action',recurring:'id,nextDate',settings:'key'});
// v26 included a temporary local snapshots store. v29 removes it while preserving finance tables.
db.version(2).stores({records:'id,date,type,account,mainCategory',accounts:'id,name,type',stocks:'id,date,symbol,action',recurring:'id,nextDate',settings:'key',localBackups:'++id,createdAt'});
// v29: remove the obsolete localBackups table and its snapshots; do not touch transaction or settings tables.
db.version(3).stores({localBackups:null});
// v41: official ISIN list cached separately from financial records and JSON backups.
db.version(4).stores({marketCache:'key'});
// v62: separate non-listed investment assets and their valuation history.
db.version(5).stores({investmentValuations:'++id,assetId,date',investmentFlows:'id,assetId,date,sourceAccount'});
// v148: one local end-of-day/latest-observed net worth entry per calendar day.
db.version(6).stores({netWorthHistory:'date'});
export const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
import {defaultCategories,migrateCategoryData} from './categoryPresets.js';
export {defaultCategories} from './categoryPresets.js';
export async function ensureDefaults(){
 // Read/update all linked tables atomically; migrating a category must also
 // migrate transaction and recurring references, or edit forms become invalid.
 await db.transaction('rw',db.settings,db.records,db.recurring,async()=>{
  const categorySetting=await db.settings.get('categories');
  const presetMarker=await db.settings.get('categoryPresetVersion');
  const currentVersion=Number(presetMarker?.value)||0;
  if(!categorySetting){
   await db.settings.put({key:'categories',value:structuredClone(defaultCategories)});
  }else if(currentVersion<169){
   const [records,recurring,iconSetting]=await Promise.all([
    db.records.toArray(),db.recurring.toArray(),db.settings.get('categoryIcons')
   ]);
   const migrated=migrateCategoryData(categorySetting.value,records,recurring,iconSetting?.value||{});
   await db.settings.put({key:'categories',value:migrated.categories});
   if(iconSetting)await db.settings.put({key:'categoryIcons',value:migrated.icons});
   for(let i=0;i<records.length;i++){
    const before=records[i],after=migrated.records[i];
    if(before.mainCategory!==after.mainCategory||before.subCategory!==after.subCategory)
     await db.records.update(before.id,{mainCategory:after.mainCategory,subCategory:after.subCategory});
   }
   for(let i=0;i<recurring.length;i++){
    const before=recurring[i],after=migrated.recurring[i];
    if(before.mainCategory!==after.mainCategory||before.subCategory!==after.subCategory)
     await db.recurring.update(before.id,{mainCategory:after.mainCategory,subCategory:after.subCategory});
   }
  }
  if(currentVersion<169)await db.settings.put({key:'categoryPresetVersion',value:169});
  if(!await db.settings.get('theme'))await db.settings.put({key:'theme',value:'dark'});
  if(!await db.settings.get('fontScale'))await db.settings.put({key:'fontScale',value:1});
 });
}
// Safari 在區域網路 HTTP（如 http://192.168.x.x）可能不提供 crypto.randomUUID。
// 優先使用原生 UUID；否則使用 getRandomValues，最後才退回 Math.random。
export function uid(){
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
export async function snapshot(){const [records,accounts,stocks,recurring,settings,investmentValuations,investmentFlows,netWorthHistory]=await Promise.all([db.records.toArray(),db.accounts.toArray(),db.stocks.toArray(),db.recurring.toArray(),db.settings.toArray(),db.investmentValuations.toArray(),db.investmentFlows.toArray(),db.netWorthHistory.toArray()]);return {app:'cyberpulse-liquid',version:2,exportedAt:new Date().toISOString(),records,accounts,stocks,recurring,settings,investmentValuations,investmentFlows,netWorthHistory};}
export async function restore(data){
 if(data?.app!=='cyberpulse-liquid'||![1,2].includes(data.version)||!['records','accounts','stocks','recurring','settings'].every(k=>Array.isArray(data[k])))throw Error('備份格式或版本不正確');
 if(data.version===2&&(!Array.isArray(data.investmentValuations)||!Array.isArray(data.investmentFlows)))throw Error('備份缺少投資資金異動紀錄');
 const tables=[db.records,db.accounts,db.stocks,db.recurring,db.settings,db.investmentValuations,db.investmentFlows,db.netWorthHistory];
 await db.transaction('rw',...tables,async()=>{
  for(const t of tables)await t.clear();
  await Promise.all([db.records.bulkPut(data.records),db.accounts.bulkPut(data.accounts),db.stocks.bulkPut(data.stocks),db.recurring.bulkPut(data.recurring),db.settings.bulkPut(data.settings),db.investmentValuations.bulkPut(data.investmentValuations||[]),db.investmentFlows.bulkPut(data.investmentFlows||[]),db.netWorthHistory.bulkPut(Array.isArray(data.netWorthHistory)?data.netWorthHistory:[])]);
 });
}
// 帳戶餘額從期初餘額與交易推導，避免刪改資料造成累積誤差。
export const accountBalance=(a,records,stocks,investmentFlows=[])=>Number(a.openingBalance||0)+records.reduce((s,t)=>s+(t.type==='income'&&t.account===a.id?t.amount:t.type==='expense'&&t.account===a.id?-t.amount:t.type==='transfer'&&t.toAccount===a.id?t.amount:t.type==='transfer'&&t.fromAccount===a.id?-t.amount:0),0)+stocks.reduce((s,t)=>s+(t.account!==a.id?0:t.action==='buy'?-t.totalAmount:t.action==='sell'?t.totalAmount:t.action==='dividend'?t.amount:0),0)-investmentFlows.reduce((sum,f)=>sum+(f.kind==='contribution'&&f.sourceAccount===a.id?Number(f.amount||0):0),0);
export function holdings(stocks){
 return calculateLots(stocks).groups.filter(g=>g.shares>0).map(g=>({symbol:g.symbol,shares:g.shares,cost:g.cost,lastPrice:g.lots.at(-1)?.price||0}));
}
