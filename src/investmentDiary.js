import {redemptionGrossInAccountCurrency} from './investmentCashFlow.js';
/**
 * Project investment cash flows into the diary without creating a second money
 * movement in db.records. Both account balances and net worth already sum
 * db.investmentFlows, so inserting regular income/expense rows would double count.
 */
export function investmentDiaryRows(flows=[],accounts=[],products=[]){
 return flows.flatMap(f=>{
  if(f.historical)return [];
  const account=accounts.find(a=>a.id===f.sourceAccount);
  if(!account)return [];
  const asset=accounts.find(a=>a.id===f.assetId)||products.find(a=>a.id===f.assetId);
  const redemption=f.kind==='redemption';
  const yieldPayment=f.kind==='yield';
  const base={investmentFlowId:f.id,isInvestmentFlow:true,date:f.date,account:f.sourceAccount};
  const gross=(redemption||yieldPayment)?redemptionGrossInAccountCurrency(f):Number(f.amount)||0;
  const transfer={...base,id:`investment-flow:${f.id}`,type:yieldPayment?'income':'investment',investmentAction:f.kind,
   amount:gross,mainCategory:yieldPayment?'投資收益':'投資資金異動',subCategory:yieldPayment?({bond:'債券票息',fund:'基金配息',savings:'儲蓄險給付',termDeposit:'定存利息'}[asset?.type]||'投資收益'):redemption?'投資贖回':'追加投入',
   note:`${asset?.name||'投資資產'} · ${yieldPayment?'配息／票息':redemption?'贖回入帳':'追加投入'}${(redemption||yieldPayment)&&asset?.currency!==account.currency?` · ${asset?.currency} ${Number(f.amount).toLocaleString('zh-TW')} × ${Number(f.redemptionExchangeRate||1).toLocaleString('zh-TW',{maximumFractionDigits:8})}`:''}${f.note?' · '+f.note:''}`};
  const fee=(redemption||yieldPayment)?Number(f.redemptionFee)||0:0;
  return fee>0?[transfer,{...base,id:`investment-fee:${f.id}`,type:'expense',investmentAction:'fee',
   amount:fee,mainCategory:'投資費用',subCategory:yieldPayment?'配息手續費':'贖回手續費',
   note:`${asset?.name||'投資資產'} · ${yieldPayment?'配息手續費':'贖回手續費'}` }]:[transfer];
 });
}
