import {initialTrustShares, contributionTrustShares} from './trustShares.js';
import {contributionPersonalCost} from './trustSubsidy.js';
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
// Chronological replay keeps redemptions separate from contributions and retains
// the correct remaining cost instead of incorrectly treating proceeds as cost.
export function investmentPosition(account, flows=[]) {
  const trust=account?.type==='trust';
  let cost=num(account?.investmentCost), shares=trust?initialTrustShares(account):0, realized=0, valid=true;
  const ordered=flows.filter(f=>f.assetId===account?.id && ['contribution','redemption'].includes(f.kind))
    .slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a.id).localeCompare(String(b.id)));
  for(const flow of ordered){
    if(flow.kind==='contribution') {cost+=trust?contributionPersonalCost(flow):num(flow.amount);if(trust)shares+=contributionTrustShares(flow);}
    else {
      const qty=contributionTrustShares(flow);
      // Trust uses weighted average remaining acquisition cost at redemption.
      const removed=trust?(shares>0?cost*Math.min(qty,shares)/shares:0):num(flow.costBasis);
      if(removed>cost+1e-7 || (trust && qty>shares+1e-7))valid=false;
      cost-=removed;
      if(trust)shares-=qty;
      realized+=num(flow.amount)-removed;
    }
    if(cost < -1e-7 || (trust&&shares < -1e-7))valid=false;
  }
  return {cost:Math.abs(cost)<1e-8?0:cost,shares:Math.abs(shares)<1e-8?0:shares,realized,valid:valid&&cost>=-1e-7&&(!trust||shares>=-1e-7)};
}
export function redemptionCostAt(account,otherFlows,redemption) {
  const trust=account?.type==='trust';
  const prior=otherFlows.filter(f=>f.assetId===account.id&&(String(f.date||'')<String(redemption.date||'') || (f.date===redemption.date && String(f.createdAt||'')<=String(redemption.createdAt||''))));
  const pos=investmentPosition(account,prior);
  if(!pos.valid)return {valid:false,costBasis:0};
  const qty=contributionTrustShares(redemption);
  if(trust && (!(qty>0)||qty>pos.shares+1e-7))return {valid:false,costBasis:0};
  const costBasis=trust?(pos.shares>0?pos.cost*qty/pos.shares:0):num(redemption.costBasis);
  if(!trust&&(costBasis<0||costBasis>pos.cost+1e-7))return {valid:false,costBasis};
  return {valid:true,costBasis};
}
