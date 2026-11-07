/** Investment flow amounts are in the asset currency. Linked account entries
 * are in the destination account currency, at the rate fixed on trade date.
 * Fee is charged in the linked account currency, not in asset currency. */
export function redemptionExchangeRate(flow) {
 const rate=Number(flow?.redemptionExchangeRate ?? 1);
 return Number.isFinite(rate)&&rate>0?rate:1; // legacy single-currency flows
}
export function investmentCashMovement(flow){
 const amount=Number(flow?.amount)||0;
 if(flow?.kind==='redemption')return amount*redemptionExchangeRate(flow)-Math.max(0,Number(flow.redemptionFee)||0);
 if(flow?.kind==='contribution')return -amount;
 return 0;
}
export function redemptionGrossInAccountCurrency(flow){
 return (Number(flow?.amount)||0)*redemptionExchangeRate(flow);
}
export function suggestedRedemptionRate(asset,account){
 if(!asset||!account)return null;
 if(asset.currency===account.currency)return 1;
 const source=asset.currency==='TWD'?1:Number(asset.fxRate);
 const dest=account.currency==='TWD'?1:Number(account.fxRate);
 return Number.isFinite(source)&&source>0&&Number.isFinite(dest)&&dest>0?source/dest:null;
}
