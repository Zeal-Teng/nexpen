// Independent fund and bond ledger. Flows live in investmentFlows so cash accounts
// and diary remain single-source-of-truth. Bond units are face value; quoted price
// is per 100 units of face. Fund units are fund shares, price is NAV per share.
const numeric=x=>Number.isFinite(Number(x))?Number(x):0;
export function investmentProductPosition(asset,flows=[]){
 let units=0,cost=0,realized=0,valid=true;
 const ordered=flows.filter(f=>f.assetId===asset.id&&(f.kind==='contribution'||f.kind==='redemption')).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a.id).localeCompare(String(b.id)));
 for(const f of ordered){
  const qty=numeric(f.shares);const amount=numeric(f.amount);
  if(f.kind==='contribution'){units+=qty;cost+=amount;}
  else{if(qty>units+1e-7||qty<=0)valid=false;const basis=units>0?cost*qty/units:0;units-=qty;cost-=basis;realized+=amount-basis;}
  if(units< -1e-7||cost< -1e-7)valid=false;
 }
 return {units:Math.abs(units)<1e-7?0:units,cost:Math.abs(cost)<1e-7?0:cost,realized,valid};
}
export function investmentProductValue(asset,position){
 const price=numeric(asset.price);
 if(asset.type==='termDeposit')return Math.max(0,position.units); // principal outstanding; interest only when received
 if(asset.type==='savings')return position.units>0?price:0; // entered current surrender value, not total premiums
 return Math.max(0,position.units)*price*(asset.type==='bond'?0.01:1);
}
export function productCashRate(product,account){
 if(product.currency===account.currency)return 1;
 const src=product.currency==='TWD'?1:Number(product.fxRate);const dest=account.currency==='TWD'?1:Number(account.fxRate);
 return src>0&&dest>0?src/dest:NaN;
}
export function validateProductTrade(product,flows,trade,account){
 if(!account&&!(product.type==='savings'&&trade.kind==='contribution'&&trade.historical))throw Error('請選擇資金帳戶');
 if(trade.kind==='contribution'&&account&&product.currency!==account.currency)throw Error('申購帳戶需與投資商品相同幣別');
 if(!(Number(trade.amount)>0)||(!(Number(trade.shares)>0)&&trade.kind!=='yield'))throw Error('金額及數量必須大於零');
 if(trade.kind==='yield'&&!(Number(trade.amount)>0))throw Error('配息／票息金額必須大於零');
 if(trade.kind!=='contribution'&&!(Number(trade.redemptionExchangeRate)>0))throw Error('請填入有效換算匯率');
 if(!(Number(trade.redemptionFee)>=0))throw Error('手續費不可為負數');
 if(trade.kind==='redemption'&&!investmentProductPosition(product,[...flows,trade]).valid)throw Error('贖回數量超過當時持有數量');
 return true;
}
