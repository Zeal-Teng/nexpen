// Pure, fictional sample dataset. No personal data or storage access.
const pad = n => String(n).padStart(2,'0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const daysBefore = n => {const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);return iso(d)};
const nextMonth = () => {const d=new Date();d.setDate(1);d.setMonth(d.getMonth()+1);return iso(d)};

export function createDemoDataset() {
 const accounts = [
  {id:'demo-bank',name:'星河銀行｜日常帳戶',type:'bank',openingBalance:168000,currency:'TWD',fxRate:1,decimalPlaces:2,isDefault:true,includeInAssets:true},
  {id:'demo-usd',name:'星河銀行｜美元帳戶',type:'bank',openingBalance:42000,currency:'USD',fxRate:31.8,decimalPlaces:2,includeInAssets:true},
  {id:'demo-eur',name:'星河銀行｜歐元帳戶',type:'bank',openingBalance:9500,currency:'EUR',fxRate:35.4,decimalPlaces:2,includeInAssets:true},
  {id:'demo-cash',name:'現金錢包',type:'cash',openingBalance:5800,currency:'TWD',fxRate:1,decimalPlaces:0,includeInAssets:true},
  {id:'demo-credit',name:'示範信用卡',type:'credit',openingBalance:-12500,currency:'TWD',fxRate:1,decimalPlaces:0,includeInAssets:true},
  {id:'demo-broker',name:'星辰證券交割帳戶',type:'brokerage',openingBalance:920000,currency:'TWD',fxRate:1,decimalPlaces:0,includeInAssets:true},
  {id:'demo-trust',name:'範例持股信託',type:'trust',openingBalance:0,investmentCost:240000,trustSymbol:'2330',trustShares:400,currency:'TWD',fxRate:1,decimalPlaces:2,includeInAssets:true},
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
 // Fictional samples for every standalone investment type. Cashflows use
 // the SAME investmentFlows source as real trades, so diary/account balances
 // and asset valuations are exercised together. Historical policy premiums
 // intentionally have no sourceAccount and cannot debit a current cash account.
 const demoProduct=(id,type,name,currency,fxRate,price,extra={})=>({
  id:`demo-${id}`,type,name,currency,fxRate,price,priceDate:daysBefore(1),
  createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...extra
 });
 const investmentProducts=[
  demoProduct('fund-global','fund','環球股票基金（示範）','USD',31.8,15.82,{symbol:'DEMO-GLOBAL'}),
  demoProduct('fund-income','fund','平衡收益基金（示範）','TWD',1,11.64,{symbol:'DEMO-INCOME'}),
  demoProduct('bond-gov','bond','美元公債（示範）','USD',31.8,102.35,{symbol:'US-TREASURY-DEMO',couponRate:'4.25',couponFrequency:'6',maturityDate:'2031-10-15'}),
  demoProduct('bond-corp','bond','台幣公司債（示範）','TWD',1,98.75,{symbol:'TWD-CORP-DEMO',couponRate:'2.8',couponFrequency:'12',maturityDate:'2029-12-31'}),
  demoProduct('savings-usd','savings','美元利率變動型終身壽險（示範）','USD',31.8,14550.28,{
   institution:'示範保險公司',symbol:'DEMO-POLICY',startDate:'2020-11-07',policySubtype:'rateAdjustableWholeLife',premiumYears:'6',declaredRate:'3.75',bonusMethod:'increaseCoverage',
   projectionRows:[
    {year:5,cumulativePremium:10000,endValue:10125,nextValue:10180},
    {year:6,cumulativePremium:12000,endValue:12300,nextValue:12355},
    {year:7,cumulativePremium:12000,endValue:13020,nextValue:13075},
    {year:10,cumulativePremium:12000,endValue:15360,nextValue:15430},
    {year:15,cumulativePremium:12000,endValue:18900,nextValue:18980}
   ]
  }),
  demoProduct('savings-twd','savings','台幣養老保險（示範）','TWD',1,158000,{institution:'示範人壽',symbol:'DEMO-ENDOW',startDate:'2023-05-01',maturityDate:'2033-05-01',policySubtype:'endowment',premiumYears:'10',declaredRate:'2.1',bonusMethod:'cash'}),
  demoProduct('deposit-twd','termDeposit','星河銀行一年期定存（示範）','TWD',1,1,{institution:'星河銀行',symbol:'TWD-TD-DEMO',startDate:daysBefore(100),maturityDate:nextMonth(),couponRate:'1.8'}),
  demoProduct('deposit-usd','termDeposit','美元六個月定存（示範）','USD',31.8,1,{institution:'星河銀行',symbol:'USD-TD-DEMO',startDate:daysBefore(90),maturityDate:nextMonth(),couponRate:'3.6'})
 ];
 const demoFlow=(id,assetId,kind,age,amount,shares,sourceAccount,extra={})=>({
  id:`demo-${id}`,assetId:`demo-${assetId}`,kind,date:daysBefore(age),
  amount,shares,sourceAccount,redemptionExchangeRate:1,redemptionFee:0,
  createdAt:`${daysBefore(age)}T09:00:00.000Z`,...extra
 });
 const newInvestmentFlows=[
  demoFlow('fund-global-buy','fund-global','contribution',120,11000,750,'demo-usd'),
  demoFlow('fund-global-sell','fund-global','redemption',24,1700,100,'demo-usd',{redemptionFee:4,note:'基金部分贖回'}),
  demoFlow('fund-global-dividend','fund-global','yield',12,48,0,'demo-usd'),
  demoFlow('fund-income-buy','fund-income','contribution',140,200000,20000,'demo-bank'),
  demoFlow('fund-income-redemption','fund-income','redemption',8,34000,3000,'demo-bank',{redemptionFee:80}),
  demoFlow('bond-gov-buy','bond-gov','contribution',160,10050,10000,'demo-usd'),
  demoFlow('bond-gov-coupon','bond-gov','yield',15,212.5,0,'demo-usd'),
  demoFlow('bond-gov-redeem','bond-gov','redemption',5,2060,2000,'demo-usd',{redemptionFee:5}),
  demoFlow('bond-corp-buy','bond-corp','contribution',100,148000,150000,'demo-bank'),
  demoFlow('bond-corp-coupon','bond-corp','yield',15,2100,0,'demo-bank'),
  demoFlow('savings-usd-2020','savings-usd','contribution',2100,2000,2000,'',{historical:true,date:'2020-11-07'}),
  demoFlow('savings-usd-2021','savings-usd','contribution',1735,2000,2000,'',{historical:true,date:'2021-11-07'}),
  demoFlow('savings-usd-2022','savings-usd','contribution',1370,2000,2000,'',{historical:true,date:'2022-11-07'}),
  demoFlow('savings-usd-2023','savings-usd','contribution',1005,2000,2000,'',{historical:true,date:'2023-11-07'}),
  demoFlow('savings-usd-2024','savings-usd','contribution',640,2000,2000,'',{historical:true,date:'2024-11-07'}),
  demoFlow('savings-usd-2025','savings-usd','contribution',275,2000,2000,'',{historical:true,date:'2025-11-07'}),
  demoFlow('savings-usd-payout','savings-usd','yield',20,110,0,'demo-usd',{note:'示範給付'}),
  demoFlow('savings-twd-premium','savings-twd','contribution',95,150000,150000,'demo-bank'),
  demoFlow('savings-twd-partial','savings-twd','redemption',17,30000,30000,'demo-bank',{redemptionFee:100}),
  demoFlow('deposit-twd-open','deposit-twd','contribution',100,180000,180000,'demo-bank'),
  demoFlow('deposit-twd-interest','deposit-twd','yield',10,800,0,'demo-bank'),
  demoFlow('deposit-twd-withdraw','deposit-twd','redemption',2,20000,20000,'demo-bank'),
  demoFlow('deposit-usd-open','deposit-usd','contribution',90,5000,5000,'demo-usd'),
  demoFlow('deposit-usd-interest','deposit-usd','yield',9,45,0,'demo-usd')
 ];
 const recurring = [
  {id:'demo-salary-rule',name:'每月示範薪資',type:'income',amount:68000,account:'demo-bank',mainCategory:'主動收入',subCategory:'薪資所得',freq:'monthly',nextDate:nextMonth()},
  {id:'demo-sub-rule',name:'影音訂閱示例',type:'expense',amount:390,account:'demo-credit',mainCategory:'訂閱服務',subCategory:'影音串流',freq:'monthly',nextDate:nextMonth()},
 ];
 const investmentValuations=[{assetId:'demo-policy',date:daysBefore(2),value:418500,createdAt:new Date().toISOString()}];
 const investmentFlows=[{id:'demo-trust-flow',assetId:'demo-trust',kind:'contribution',date:daysBefore(35),amount:60000,shares:100,sourceAccount:'demo-bank',note:'示範追加投入',createdAt:new Date().toISOString()},...newInvestmentFlows];
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
  {key:'demoSeedVersion',value:2},
 ];
 return {accounts,records,stocks,recurring,investmentValuations,investmentFlows,investmentProducts,netWorthHistory,settings};
}
