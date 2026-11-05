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
// v168: preset inspired by the user's category reference screenshots.
// These labels are NEXPEN defaults, not a copy of the reference app's complete data.
export const defaultCategories = {
 expense: {
  '飲食':['早餐','午餐','晚餐','飲料咖啡','零食點心','聚餐','其他飲食'],
  '住家':['房租房貸','水費','電費','瓦斯','管理費','居家修繕','家具家電','生活用品'],
  '電信':['手機電信費','網路費','通訊設備','訂閱服務'],
  '交通':['大眾運輸','油資','停車費','計程車／叫車','車輛保養','過路費','其他交通'],
  '學習':['學費','補習課程','書籍教材','文具用品','研習進修'],
  '娛樂':['電影展演','遊戲','影音串流','旅遊','休閒活動'],
  '購物':['服飾鞋包','美妝保養','電子產品','生活百貨','線上購物'],
  '家庭':['育兒用品','孝親費','家庭支出','寵物用品'],
  '送禮&捐贈':['禮金紅包','生日節慶','公益捐款','其他贈禮'],
  '醫療&健康':['門診掛號','藥品','牙科','健檢','健身運動','保健用品'],
  '金融&保險':['保險費','銀行手續費','貸款利息','投資手續費'],
  '稅金':['所得稅','房屋稅','地價稅','牌照稅','其他稅費'],
  '其他雜項':['未分類支出','臨時支出','其他費用']
 },
 income: {
  '主動收入':['薪資','獎金','年終獎金','加班費','兼職收入','接案收入'],
  '被動收入':['股利','利息','租金收入','投資收益','權利金'],
  '意外收入':['中獎獎金','發票中獎','退款退費','補助津貼','意外所得'],
  '其他':['二手出售','親友贈與','其他收入']
 }
};
// Keep older factory defaults to identify an unmodified installation safely.
const legacyDefaultCategories = {expense:{'餐飲美食':['早餐','午餐','晚餐','手搖咖啡','聚會聚餐'],'交通運輸':['大眾捷運','油資加滿','停車場','計程車/Uber'],'居住居家':['租金房貸','水電瓦斯','生活雜貨','居家裝潢'],'休閒娛樂':['遊戲課金','電影串流','旅行露營'],'醫療健康':['看診掛號','日常保健品','健身運動']},income:{'薪資所得':['每月底薪','專案獎金','年終津貼','副業兼差'],'投資收益':['股票股利','資本利得','定存利息','租金收入'],'其他收入':['二手變賣','政府補助款','中獎發票']}};
export async function ensureDefaults(){
 await db.transaction('rw',db.settings,async()=>{
  const categorySetting=await db.settings.get('categories');
  const presetMarker=await db.settings.get('categoryPresetVersion');
  if(!categorySetting){
   await db.settings.put({key:'categories',value:structuredClone(defaultCategories)});
  }else if(!presetMarker || Number(presetMarker.value)<168){
   const existing=categorySetting.value;
   if(existing&&typeof existing==='object'){
    // Replace only untouched factory categories. Custom users keep every existing
    // main/sub category in its original order; missing presets are appended.
    const untouched=JSON.stringify(existing)===JSON.stringify(legacyDefaultCategories);
    const merged=untouched ? structuredClone(defaultCategories) : structuredClone(existing);
    if(!untouched){
     for(const flow of ['expense','income']){
      if(!merged[flow]||typeof merged[flow]!=='object')merged[flow]={};
      for(const [main,subs] of Object.entries(defaultCategories[flow])){
       if(!(main in merged[flow]))merged[flow][main]=[...subs];
      }
     }
    }
    await db.settings.put({key:'categories',value:merged});
   }
  }
  if(!presetMarker || Number(presetMarker.value)<168)await db.settings.put({key:'categoryPresetVersion',value:168});
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
