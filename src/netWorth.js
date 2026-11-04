export const ASSET_GROUPS = [
  {id:'cash', label:'現金'},
  {id:'deposit', label:'存款'},
  {id:'securities', label:'證券'},
  {id:'trust', label:'持股信託'},
  {id:'insurance', label:'保險'},
  {id:'other', label:'其他資產'}
];

const accountBalance=(a,records,stocks,flows)=> finite(a.openingBalance)
 + records.reduce((s,t)=>s+(t.type==='income'&&t.account===a.id?finite(t.amount):t.type==='expense'&&t.account===a.id?-finite(t.amount):t.type==='transfer'&&t.toAccount===a.id?finite(t.amount):t.type==='transfer'&&t.fromAccount===a.id?-finite(t.amount):0),0)
 + stocks.reduce((s,t)=>s+(t.account!==a.id?0:t.action==='buy'?-finite(t.totalAmount):t.action==='sell'?finite(t.totalAmount):t.action==='dividend'?finite(t.amount):0),0)
 - flows.reduce((sum,f)=>sum+(f.kind==='contribution'&&f.sourceAccount===a.id?finite(f.amount):0),0);

const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
export const DEFAULT_ASSET_GROUP_BY_TYPE = Object.freeze({cash:'cash',bank:'deposit',ewallet:'deposit',brokerage:'deposit',trust:'trust',policy:'insurance'});
export const assetGroupForType=(type,accountTypes=[])=>{
  if(type==='trust')return 'trust';
  if(type==='policy')return 'insurance';
  const configured=accountTypes.find(t=>t.id===type)?.assetGroup;
  return ASSET_GROUPS.some(g=>g.id===configured)?configured:(DEFAULT_ASSET_GROUP_BY_TYPE[type]||'other');
};

/** All monetary amounts returned here are in TWD, consistent with the app's base ledger. */
export function computeNetWorth({accounts=[],records=[],stocks=[],investmentFlows=[],quotes={},includedHoldings=[],accountTypes=[]}) {
  const groups = Object.fromEntries(ASSET_GROUPS.map(g=>[g.id,0]));
  const liabilities=[];
  const missingQuotes=[];
  for (const account of accounts) {
    if(account.includeInAssets===false) continue;
    const rate=account.currency==='TWD'||!account.currency ? 1 : finite(account.fxRate)||1;
    let value;
    if(account.type==='trust') {
      const symbol=String(account.trustSymbol||'').trim().toUpperCase();
      const added=investmentFlows.filter(f=>f.assetId===account.id&&f.kind==='contribution');
      const lots=finite(account.trustLots)+added.reduce((s,f)=>s+finite(f.units),0);
      const price=Number(quotes[symbol]?.price);
      if(lots>0&&!(price>0)) missingQuotes.push(account.name||symbol||'持股信託');
      value=price>0 ? lots*1000*price : 0; // trust symbols are TWD-listed securities
    } else if(account.type==='policy') {
      value=finite(account.policyValue)*rate;
    } else {
      value=finite(accountBalance(account,records,stocks,investmentFlows))*rate;
    }
    if(value>=0) groups[assetGroupForType(account.type,accountTypes)]+=value;
    else liabilities.push({id:account.id,name:account.name||'未命名帳戶',type:account.type,amount:-value});
  }
  for(const holding of includedHoldings){
    const price=Number(quotes[holding.symbol]?.price);
    if(!(price>0)) {missingQuotes.push(holding.symbol);continue;}
    groups.securities+=finite(holding.shares)*price;
  }
  const assets=ASSET_GROUPS.map(g=>({...g,amount:groups[g.id]})).filter(g=>g.amount>0);
  const totalAssets=assets.reduce((s,g)=>s+g.amount,0);
  const totalLiabilities=liabilities.reduce((s,x)=>s+x.amount,0);
  const portions=assets.map(g=>({...g,percent:totalAssets>0?g.amount/totalAssets*100:0}));
  return {assets:portions,liabilities,totalAssets,totalLiabilities,netWorth:totalAssets-totalLiabilities,missingQuotes};
}
