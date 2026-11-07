import {redemptionGrossInAccountCurrency} from './investmentCashFlow.js';
/**
 * Project investment cash flows into the diary without creating a second money
 * movement in db.records. Both account balances and net worth already sum
 * db.investmentFlows, so inserting regular income/expense rows would double count.
 */
export function investmentDiaryRows(flows=[],accounts=[]){
 return flows.flatMap(f=>{
  const account=accounts.find(a=>a.id===f.sourceAccount);
  if(!account)return [];
  const asset=accounts.find(a=>a.id===f.assetId);
  const redemption=f.kind==='redemption';
  const base={investmentFlowId:f.id,isInvestmentFlow:true,date:f.date,account:f.sourceAccount};
  const gross=redemption?redemptionGrossInAccountCurrency(f):Number(f.amount)||0;
  const transfer={...base,id:`investment-flow:${f.id}`,type:'investment',investmentAction:f.kind,
   amount:gross,mainCategory:'投資資金異動',subCategory:redemption?'投資贖回':'追加投入',
   note:`${asset?.name||'投資資產'} · ${redemption?'贖回入帳':'追加投入'}${redemption&&asset?.currency!==account.currency?` · ${asset?.currency} ${Number(f.amount).toLocaleString('zh-TW')} × ${Number(f.redemptionExchangeRate||1).toLocaleString('zh-TW',{maximumFractionDigits:8})}`:''}${f.note?' · '+f.note:''}`};
  const fee=redemption?Number(f.redemptionFee)||0:0;
  return fee>0?[transfer,{...base,id:`investment-fee:${f.id}`,type:'expense',investmentAction:'fee',
   amount:fee,mainCategory:'投資費用',subCategory:'贖回手續費',
   note:`${asset?.name||'投資資產'} · 贖回手續費` }]:[transfer];
 });
}
