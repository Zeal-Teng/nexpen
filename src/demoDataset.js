// Pure, fictional sample dataset. No personal data or storage access.
const pad = n => String(n).padStart(2,'0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const daysBefore = n => {const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);return iso(d)};
const nextMonth = () => {const d=new Date();d.setDate(1);d.setMonth(d.getMonth()+1);return iso(d)};

export function createDemoDataset() {
 const accounts = [
  {id:'demo-bank',name:'星河銀行｜日常帳戶',type:'bank',openingBalance:168000,currency:'TWD',fxRate:1,decimalPlaces:2,isDefault:true,includeInAssets:true},
  {id:'demo-cash',name:'現金錢包',type:'cash',openingBalance:5800,currency:'TWD',fxRate:1,decimalPlaces:0,includeInAssets:true},
  {id:'demo-credit',name:'示範信用卡',type:'credit',openingBalance:-12500,currency:'TWD',fxRate:1,decimalPlaces:0,includeInAssets:true},
  {id:'demo-broker',name:'星辰證券交割帳戶',type:'brokerage',openingBalance:920000,currency:'TWD',fxRate:1,decimalPlaces:0,includeInAssets:true},
  {id:'demo-trust',name:'範例持股信託',type:'trust',openingBalance:0,investmentCost:240000,trustSymbol:'2330',trustLots:0.4,currency:'TWD',fxRate:1,decimalPlaces:2,includeInAssets:true},
  {id:'demo-policy',name:'範例投資保單',type:'policy',openingBalance:0,investmentCost:380000,policyValue:418500,policyValueDate:daysBefore(2),currency:'TWD',fxRate:1,decimalPlaces:2,includeInAssets:true},
 ];
 const records = [];
 const add = (id,age,type,amount,account,mainCategory,subCategory,note='',projectId='') =>
  records.push({id:`demo-${id}`,date:daysBefore(age),type,amount,account,mainCategory,subCategory,note,projectId});
 for(let m=0;m<6;m++){
  const d=m*30;
  add(`salary-${m}`,d+6,'income',68000,'demo-bank','主動收入','薪資所得','示範薪資');
  add(`freelance-${m}`,d+12,'income',12500,'demo-bank','主動收入','兼職收入','假資料：接案');
  add(`rent-${m}`,d+4,'expense',18000,'demo-bank','居家生活','房租','示範租金');
  add(`subscription-${m}`,d+9,'expense',690,'demo-credit','訂閱服務','AI 工具','訂閱服務示例');
  add(`electric-${m}`,d+14,'expense',1450,'demo-bank','居家生活','電費','示範水電');
  add(`transport-${m}`,d+20,'expense',1200,'demo-bank','交通運輸','大眾運輸','示範通勤');
  add(`meal-${m}`,d+7,'expense',320,'demo-cash','餐飲美食','午餐','餐飲消費');
  add(`shopping-${m}`,d+18,'expense',2300,'demo-credit','購物消費','生活用品','示範網購');
 }
 add('coffee',1,'expense',130,'demo-cash','餐飲美食','咖啡','咖啡');
 add('meal-today',0,'expense',180,'demo-cash','餐飲美食','晚餐','今日示範交易');
 add('bonus',3,'income',5000,'demo-bank','主動收入','獎金','額外獎金');
 add('lotto',5,'expense',100,'demo-cash','休閒娛樂','樂透','示範樂透');
 records.push({id:'demo-transfer',date:daysBefore(9),type:'transfer',amount:3500,fromAccount:'demo-bank',toAccount:'demo-cash',mainCategory:'帳戶互轉',subCategory:'內部轉帳',note:'零用金轉帳'});
 const stocks = [
  {id:'demo-tsmc-buy',date:daysBefore(110),action:'buy',symbol:'2330',securityName:'台積電（範例）',securityType:'stock',account:'demo-broker',shares:1000,price:610,fee:520,tax:0,totalAmount:610520},
  {id:'demo-0050-buy',date:daysBefore(100),action:'buy',symbol:'0050',securityName:'元大台灣50（範例）',securityType:'etf',account:'demo-broker',shares:1000,price:152,fee:130,tax:0,totalAmount:152130},
  {id:'demo-tsmc-sell',date:daysBefore(31),action:'sell',symbol:'2330',securityName:'台積電（範例）',securityType:'stock',account:'demo-broker',shares:200,price:720,fee:123,tax:432,totalAmount:143445,matchedBuyId:'demo-tsmc-buy'},
  {id:'demo-tsmc-dividend',date:daysBefore(14),action:'dividend',symbol:'2330',securityName:'台積電（範例）',securityType:'stock',account:'demo-broker',amount:2400,fee:0,tax:0},
 ];
 const recurring = [
  {id:'demo-salary-rule',name:'每月示範薪資',type:'income',amount:68000,account:'demo-bank',mainCategory:'主動收入',subCategory:'薪資所得',freq:'monthly',nextDate:nextMonth()},
  {id:'demo-sub-rule',name:'影音訂閱示例',type:'expense',amount:390,account:'demo-credit',mainCategory:'訂閱服務',subCategory:'影音串流',freq:'monthly',nextDate:nextMonth()},
 ];
 const investmentValuations=[{assetId:'demo-policy',date:daysBefore(2),value:418500,createdAt:new Date().toISOString()}];
 const investmentFlows=[{id:'demo-trust-flow',assetId:'demo-trust',kind:'contribution',date:daysBefore(35),amount:60000,units:0.1,sourceAccount:'demo-bank',note:'示範追加投入',createdAt:new Date().toISOString()}];
 // A demo trend must span multiple days so all 7/30/90-day tabs show
 // meaningful movement immediately. These are fictional daily snapshots,
 // not historical market observations or data from a real user's ledger.
 // The live net-worth hook may replace TODAY's entry with its computed value;
 // this seed ends yesterday so that real daily snapshot behavior is preserved.
 const netWorthHistory = Array.from({length: 120}, (_, index) => {
  const age = 120 - index;
  const baseline = 1520000 + index * 2650;
  const wave = 27000 * Math.sin(index * 0.19) + 12500 * Math.sin(index * 0.61);
  const milestone = index >= 52 ? 38000 : 0;
  const netWorth = Math.round(baseline + wave + milestone);
  const totalLiabilities = Math.round(95000 - index * 215 + 3600 * Math.sin(index * 0.13));
  return {
   date: daysBefore(age),
   netWorth,
   totalAssets: netWorth + totalLiabilities,
   totalLiabilities,
   complete: true,
   capturedAt: `${daysBefore(age)}T20:00:00.000Z`,
  };
 });
 const settings = [
  {key:'theme',value:'dark'},
  {key:'projects',value:[{id:'demo-trip',name:'週末小旅行'},{id:'demo-learning',name:'個人成長'}]},
  {key:'transactionTemplates',value:[]},
  {key:'stockClosingQuotes',value:{'2330':{price:790,date:daysBefore(1),source:'demo'},'0050':{price:165,date:daysBefore(1),source:'demo'}}},
  {key:'netWorthGoalTwd',value:3000000},
  {key:'demoSeedVersion',value:1},
 ];
 return {accounts,records,stocks,recurring,investmentValuations,investmentFlows,netWorthHistory,settings};
}
