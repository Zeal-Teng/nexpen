// Rebuild policy redemption snapshots from manual valuations and redemption cash flows.
// Redemption cost is released proportionally to the policy value immediately before
// redemption; this avoids treating all proceeds as a profit or a return of principal.
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const cmp=(a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a.id).localeCompare(String(b.id));
export function policyRedemptionProjection(account,flows=[],valuations=[]){
 const mine=flows.filter(f=>f.assetId===account.id&&['contribution','redemption'].includes(f.kind)).slice().sort(cmp);
 const manual=valuations.filter(v=>v.assetId===account.id&&!v.redemptionId).slice().sort(cmp);
 const previous=valuations.filter(v=>v.assetId===account.id&&v.redemptionId).slice().sort(cmp);
 const oldById=new Map(mine.filter(f=>f.kind==='redemption').map(f=>[String(f.id),f]));
 const firstPrevious=previous.find(v=>oldById.has(String(v.redemptionId)));
 const firstManual=manual[0];
 // If the first historical redemption predates the first manual valuation, recover
 // the pre-redemption value from its saved post-redemption snapshot.
 let value=Number.isFinite(Number(account.policyRedemptionBaseValue))&&account.policyRedemptionBaseValue!==undefined&&account.policyRedemptionBaseValue!==null?n(account.policyRedemptionBaseValue):firstPrevious&&(!firstManual||cmp(firstPrevious,firstManual)<0)
  ?n(firstPrevious.value)+n(oldById.get(String(firstPrevious.redemptionId))?.amount)
  :n(account.policyValue);
 let cost=n(account.investmentCost),valid=true,manualIndex=0;
 const snapshots=[];
 for(const flow of mine){
  while(manualIndex<manual.length&&cmp(manual[manualIndex],flow)<=0){
   value=n(manual[manualIndex].value);manualIndex++;
  }
  if(flow.kind==='contribution'){cost+=n(flow.amount);continue;}
  const amount=n(flow.amount);
  if(amount<=0||amount>value+1e-7){valid=false;break;}
  const removed=value>0?cost*Math.min(amount,value)/value:0;
  if(removed>cost+1e-7){valid=false;break;}
  cost-=removed;value=Math.max(0,value-amount);
  snapshots.push({flowId:flow.id,costBasis:removed,value,date:flow.date,createdAt:flow.createdAt});
 }
 return {valid,snapshots};
}
