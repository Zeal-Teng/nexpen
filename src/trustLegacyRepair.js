import {trustContributionBreakdown} from './trustSubsidy.js';

/** Normalize older trust contributions once, so diary, balances, and investment
 * cost all read the same persisted personalCost. An explicit per-flow subsidy
 * rate always wins over the current trust account default. */
export function legacyTrustContributionPatch(flow,account){
 if(account?.type!=='trust'||flow?.kind!=='contribution'||flow?.historical)return null;
 if(flow.personalCost!==undefined&&flow.personalCost!==null&&Number.isFinite(Number(flow.personalCost))&&Number(flow.personalCost)>=0)return null;
 const rate=flow.subsidyRate??account.trustSubsidyRate??0;
 const gross=Number(flow.amount);
 if(!Number.isFinite(gross)||gross<0)return null;
 const breakdown=trustContributionBreakdown(gross,rate);
 return {subsidyRate:breakdown.subsidyRate,personalCost:breakdown.personalCost};
}

export async function repairLegacyTrustContributions(db){
 await db.transaction('rw',db.accounts,db.investmentFlows,async()=>{
  const [accounts,flows]=await Promise.all([db.accounts.toArray(),db.investmentFlows.toArray()]);
  const trustById=new Map(accounts.filter(a=>a.type==='trust').map(a=>[a.id,a]));
  for(const flow of flows){
   const patch=legacyTrustContributionPatch(flow,trustById.get(flow.assetId));
   if(patch)await db.investmentFlows.update(flow.id,patch);
  }
 });
}
