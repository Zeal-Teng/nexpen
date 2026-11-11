/** Trust contribution amount is the total acquired value, including employer support.
 * Subsidy rate is a percentage of EMPLOYEE COST (not gross acquired value).
 * Persist personalCost and subsidyRate on each new flow so later account rate
 * changes never rewrite past contributions. Legacy flows are unsubsidized. */
export function normalizeTrustSubsidyRate(value){
 const rate=Number(value ?? 0);
 if(!Number.isFinite(rate)||rate<0||rate>1000)throw Error('補助比例必須介於 0%～1000%');
 return rate;
}
export function trustContributionBreakdown(gross,rate){
 const total=Number(gross);
 const pct=normalizeTrustSubsidyRate(rate);
 if(!Number.isFinite(total)||total<0)throw Error('追加投入總額必須為有效金額');
 const personalCost=total/(1+pct/100);
 return {gross:total,subsidyRate:pct,personalCost,employerSubsidy:total-personalCost};
}
export function contributionPersonalCost(flow){
 if(flow?.kind!=='contribution')return Number(flow?.amount)||0;
 const total=Number(flow?.amount)||0;
 // Persisted basis is authoritative; existing flows have no subsidy.
 if(flow.personalCost!==undefined&&flow.personalCost!==null){
  const cost=Number(flow.personalCost);
  if(Number.isFinite(cost)&&cost>=0)return cost;
 }
 return total;
}
