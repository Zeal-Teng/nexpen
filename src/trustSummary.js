import {investmentPosition} from './investmentLedger.js';
import {trustQuoteKey} from './trustMarket.js';

/** Known quote values are always subtotaled; missing holdings remain explicit.
 * TWD is the internal valuation currency. For partially-priced portfolios,
 * performance uses only costs associated with priced positions.
 */
export function summarizeTrustPortfolio(assets=[],flows=[],quotes={}) {
 let value=0,cost=0,pricedCost=0,missingCount=0,pricedCount=0;
 for(const asset of assets){
  const position=investmentPosition(asset,flows);
  const shares=Number(position.shares)||0;
  const hasExposure=shares>1e-8;
  const hasCost=Math.abs(position.cost)>1e-8;
  if(!hasExposure&&!hasCost)continue;
  const rate=asset.currency==='TWD'||!asset.currency?1:Number(asset.fxRate);
  if(Number.isFinite(rate)&&rate>0)cost+=position.cost*rate;
  if(!hasExposure)continue;
  const price=Number(quotes[trustQuoteKey(asset)]?.price);
  if(!(Number.isFinite(rate)&&rate>0&&Number.isFinite(price)&&price>0)){
   missingCount++;continue;
  }
  value+=shares*price*rate;
  pricedCost+=position.cost*rate;
  pricedCount++;
 }
 return {cost,value,pricedCost,missingCount,pricedCount,complete:missingCount===0};
}
