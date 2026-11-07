import {investmentCashMovement} from './investmentCashFlow.js';
import {calculateLots} from './stockLots.js';
import Dexie from 'dexie';
// Demo and personal finance use different IndexedDB databases. Never move or
// overwrite the personal database when switching environments.
export const isDemoMode = (() => { try { return sessionStorage.getItem('nexpen-demo-mode') === '1'; } catch { return false; } })();
export const db = new Dexie(isDemoMode ? 'nexpen_demo_sandbox_v1' : 'cyberpulse_liquid_v1');
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
// v254: advance Dexie schema so a repaired legacy IndexedDB can be reopened
// using the same native database version. Existing tables and rows are retained.
db.version(7).stores({investmentValuations:'++id,assetId,date',investmentFlows:'id,assetId,date,sourceAccount',netWorthHistory:'date'});
db.version(8).stores({investmentValuations:'++id,assetId,date',investmentFlows:'id,assetId,date,sourceAccount',netWorthHistory:'date'});
db.version(9).stores({investmentValuations:'++id,assetId,date',investmentFlows:'id,assetId,date,sourceAccount',netWorthHistory:'date'});
// v256: fund/bond assets are independently managed, never account types.
db.version(10).stores({investmentProducts:'id,type,name,currency'});

/**
 * Repair a legacy physical IndexedDB schema BEFORE opening it through Dexie.
 * Dexie maps schema version 10 to native IndexedDB version 100, not 10.
 * An IDB transaction fails with NotFoundError if one of its object stores does
 * not physically exist, even if Dexie declares that store in db.version().
 * This routine only creates missing stores/indexes, never deletes or clears rows.
 */
export async function ensureInvestmentSchema(){
 const physical=await new Promise((resolve,reject)=>{
  const request=indexedDB.open(db.name);
  request.onerror=()=>reject(request.error||new Error('無法讀取本機記帳資料庫'));
  request.onsuccess=()=>resolve(request.result);
 });
 const specs={
  records:{keyPath:'id',indexes:['date','type','account','mainCategory']},
  accounts:{keyPath:'id',indexes:['name','type']},
  stocks:{keyPath:'id',indexes:['date','symbol','action']},
  recurring:{keyPath:'id',indexes:['nextDate']},
  settings:{keyPath:'key',indexes:[]},
  marketCache:{keyPath:'key',indexes:[]},
  investmentValuations:{keyPath:'id',autoIncrement:true,indexes:['assetId','date']},
  investmentFlows:{keyPath:'id',indexes:['assetId','date','sourceAccount']},
  netWorthHistory:{keyPath:'date',indexes:[]},
  investmentProducts:{keyPath:'id',indexes:['type','name','currency']}
 };
 const missing=Object.keys(specs).filter(name=>!physical.objectStoreNames.contains(name));
 const nativeVersion=physical.version;
 physical.close();
 if(missing.length){
  // v9 is native v90. Do not open a DB above our known schema, because
  // upgrading an unknown future version could make recovery impossible.
  if(nativeVersion>=100)throw new Error('資料庫版本較新且缺少資料表，請先備份並更新 APP，勿清除網站資料');
  await new Promise((resolve,reject)=>{
   const request=indexedDB.open(db.name,100);
   request.onblocked=()=>reject(new Error('資料庫正在其他分頁使用，請關閉其他 NEXPEN 分頁後重新開啟'));
   request.onerror=()=>reject(request.error||new Error('資料庫升級失敗，原有資料未刪除'));
   request.onupgradeneeded=()=>{
    const native=request.result;
    for(const [name,spec] of Object.entries(specs)){
     const store=native.objectStoreNames.contains(name)
      ?request.transaction.objectStore(name)
      :native.createObjectStore(name,{keyPath:spec.keyPath,autoIncrement:Boolean(spec.autoIncrement)});
     for(const field of spec.indexes)if(!store.indexNames.contains(field))store.createIndex(field,field);
    }
   };
   request.onsuccess=()=>{request.result.close();resolve();};
  });
 }
 // Dexie must not open until the missing native stores have been restored.
 await db.open();
 for(const name of Object.keys(specs)){
  if(!db.backendDB().objectStoreNames.contains(name)){
   throw new Error(`資料庫缺少 ${name} 資料表，請先備份，勿清除網站資料`);
  }
 }
}

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
  // v171: insert the new default subcategory only once. Preserve all other
  // personalized categories, order, records, recurring rules and icons.
  if(currentVersion<171){
   const latest=(await db.settings.get('categories'))?.value;
   if(latest?.expense?.['餐飲美食'] && Array.isArray(latest.expense['餐飲美食'])){
    const meals=[...latest.expense['餐飲美食']];
    if(!meals.includes('宵夜')){
     const dinner=meals.indexOf('晚餐');
     meals.splice(dinner>=0?dinner+1:meals.length,0,'宵夜');
     await db.settings.put({key:'categories',value:{...latest,expense:{...latest.expense,'餐飲美食':meals}}});
    }
   }
   await db.settings.put({key:'categoryPresetVersion',value:171});
  }
  const typeSetting=await db.settings.get('accountTypes');
  if(typeSetting&&Array.isArray(typeSetting.value)){
   const cleaned=typeSetting.value.filter(t=>t.id!=='trust'&&t.id!=='policy');
   if(cleaned.length!==typeSetting.value.length)await db.settings.put({key:'accountTypes',value:cleaned.length?cleaned:[{id:'bank',name:'銀行帳戶'}]});
  }
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
export async function snapshot(){const [records,accounts,stocks,recurring,settings,investmentValuations,investmentFlows,netWorthHistory,investmentProducts]=await Promise.all([db.records.toArray(),db.accounts.toArray(),db.stocks.toArray(),db.recurring.toArray(),db.settings.toArray(),db.investmentValuations.toArray(),db.investmentFlows.toArray(),db.netWorthHistory.toArray(),db.investmentProducts.toArray()]);return {app:'cyberpulse-liquid',version:3,exportedAt:new Date().toISOString(),records,accounts,stocks,recurring,settings,investmentValuations,investmentFlows,netWorthHistory,investmentProducts};}
export async function restore(data){
 if(data?.app!=='cyberpulse-liquid'||![1,2,3].includes(data.version)||!['records','accounts','stocks','recurring','settings'].every(k=>Array.isArray(data[k])))throw Error('備份格式或版本不正確');
 if(data.version>=2&&(!Array.isArray(data.investmentValuations)||!Array.isArray(data.investmentFlows)))throw Error('備份缺少投資資金異動紀錄');
 if(data.version>=3&&!Array.isArray(data.investmentProducts))throw Error('備份缺少基金與債券資料');
 const tables=[db.records,db.accounts,db.stocks,db.recurring,db.settings,db.investmentValuations,db.investmentFlows,db.netWorthHistory,db.investmentProducts];
 await db.transaction('rw',...tables,async()=>{
  for(const t of tables)await t.clear();
  await Promise.all([db.records.bulkPut(data.records),db.accounts.bulkPut(data.accounts),db.stocks.bulkPut(data.stocks),db.recurring.bulkPut(data.recurring),db.settings.bulkPut(data.settings),db.investmentValuations.bulkPut(data.investmentValuations||[]),db.investmentFlows.bulkPut(data.investmentFlows||[]),db.netWorthHistory.bulkPut(Array.isArray(data.netWorthHistory)?data.netWorthHistory:[]),db.investmentProducts.bulkPut(Array.isArray(data.investmentProducts)?data.investmentProducts:[])]);
 });
}
// 帳戶餘額從期初餘額與交易推導，避免刪改資料造成累積誤差。
export const accountBalance=(a,records,stocks,investmentFlows=[])=>Number(a.openingBalance||0)+records.reduce((s,t)=>s+(t.type==='adjustment'&&t.account===a.id?Number(t.amount)||0:0)+(t.type==='income'&&t.account===a.id?t.amount:t.type==='expense'&&t.account===a.id?-t.amount:t.type==='transfer'&&t.toAccount===a.id?t.amount:t.type==='transfer'&&t.fromAccount===a.id?-t.amount:0),0)+stocks.reduce((s,t)=>s+(t.account!==a.id?0:t.action==='buy'?-t.totalAmount:t.action==='sell'?t.totalAmount:t.action==='dividend'?t.amount:0),0)+investmentFlows.reduce((sum,f)=>sum+(f.sourceAccount===a.id?investmentCashMovement(f):0),0);
export function holdings(stocks){
 return calculateLots(stocks).groups.filter(g=>g.shares>0).map(g=>({symbol:g.symbol,shares:g.shares,cost:g.cost,lastPrice:g.lots.at(-1)?.price||0}));
}
