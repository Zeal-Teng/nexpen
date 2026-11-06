/**
 * Project investment cash flows into the diary without creating a second money
 * movement in db.records. Both account balances and net worth already sum
 * db.investmentFlows, so inserting regular income/expense rows would double count.
 */
export function investmentDiaryRows(flows=[],accounts=[]){
 return flows.filter(f=>f.sourceAccount&&accounts.some(a=>a.id===f.sourceAccount)).map(f=>{
  const asset=accounts.find(a=>a.id===f.assetId);
  const redemption=f.kind==='redemption';
  return {id:`investment-flow:${f.id}`,investmentFlowId:f.id,isInvestmentFlow:true,date:f.date,
   type:'investment',investmentAction:f.kind,amount:Number(f.amount)||0,account:f.sourceAccount,
   mainCategory:'投資資金異動',subCategory:redemption?'投資贖回':'追加投入',
   note:`${asset?.name||'投資資產'} · ${redemption?'贖回入帳':'追加投入'}${f.note?' · '+f.note:''}`};
 });
}
