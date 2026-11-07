import {investmentProductPosition,investmentProductValue} from './investmentProducts.js';
import {investmentCashMovement} from './investmentCashFlow.js';
import {investmentPosition} from './investmentLedger.js';
import {totalTrustShares} from './trustShares.js';
export const ASSET_GROUPS = [
  {id:'cash', label:'現金'},
  {id:'deposit', label:'存款'},
  {id:'securities', label:'證券'},
  {id:'trust', label:'持股信託'},
  {id:'insurance', label:'保險'},
  {id:'fund', label:'基金'},
  {id:'bond', label:'債券'},
  {id:'savings', label:'儲蓄險'},
  {id:'termDeposit', label:'定期存款'},
  {id:'other', label:'其他資產'}
];

const accountBalance=(a,records,stocks,flows)=> finite(a.openingBalance)
 + records.reduce((s,t)=>s+(t.type==='income'&&t.account===a.id?finite(t.amount):t.type==='expense'&&t.account===a.id?-finite(t.amount):t.type==='transfer'&&t.toAccount===a.id?finite(t.amount):t.type==='transfer'&&t.fromAccount===a.id?-finite(t.amount):0),0)
 + stocks.reduce((s,t)=>s+(t.account!==a.id?0:t.action==='buy'?-finite(t.totalAmount):t.action==='sell'?finite(t.totalAmount):t.action==='dividend'?finite(t.amount):0),0)
 + flows.reduce((sum,f)=>sum+(f.sourceAccount===a.id?investmentCashMovement(f):0),0);

const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
export const DEFAULT_ASSET_GROUP_BY_TYPE = Object.freeze({cash:'cash',bank:'deposit',ewallet:'deposit',brokerage:'deposit',trust:'trust',policy:'insurance'});
export const assetGroupForType=(type,accountTypes=[])=>{
  if(type==='trust')return 'trust';
  if(type==='policy')return 'insurance';
  const configured=accountTypes.find(t=>t.id===type)?.assetGroup;
  return ASSET_GROUPS.some(g=>g.id===configured)?configured:(DEFAULT_ASSET_GROUP_BY_TYPE[type]||'other');
};

/** All monetary amounts returned here are in TWD, consistent with the app's base ledger. */
export function computeNetWorth({accounts=[],records=[],stocks=[],investmentFlows=[],quotes={},includedHoldings=[],accountTypes=[],investmentProducts=[]}) {
  const groups = Object.fromEntries(ASSET_GROUPS.map(g=>[g.id,0]));
  const liabilities=[];
  const missingQuotes=[];
  for (const account of accounts) {
    if(account.includeInAssets===false) continue;
    const rate=account.currency==='TWD'||!account.currency ? 1 : finite(account.fxRate)||1;
    let value;
    if(account.type==='trust') {
      const symbol=String(account.trustSymbol||'').trim().toUpperCase();
      const {shares}=investmentPosition(account,investmentFlows);
      const price=Number(quotes[symbol]?.price);
      if(shares>0&&!(price>0)) missingQuotes.push(account.name||symbol||'持股信託');
      value=price>0 ? shares*price : 0; // trust symbols are TWD-listed securities
    } else if(account.type==='policy') {
      value=finite(account.policyValue)*rate;
    } else {
      value=finite(accountBalance(account,records,stocks,investmentFlows))*rate;
    }
    if(value>=0) groups[assetGroupForType(account.type,accountTypes)]+=value;
    else liabilities.push({id:account.id,name:account.name||'未命名帳戶',type:account.type,amount:-value});
  }
  for(const product of investmentProducts){
    if(product.includeInAssets===false)continue;
    const position=investmentProductPosition(product,investmentFlows);
    const twdRate=product.currency==='TWD'?1:finite(product.fxRate)||1;
    if(position.units>0&&product.type!=='termDeposit'&&!(Number(product.price)>0)){missingQuotes.push(product.name||'投資資產');continue;}
    const group=({fund:'fund',bond:'bond',savings:'savings',termDeposit:'termDeposit'})[product.type]||'other';
    groups[group]+=investmentProductValue(product,position)*twdRate;
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
