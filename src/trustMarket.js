/** Market-aware trust quote keys. Older trusts default to Taiwan. */
export const trustMarket = asset => asset?.trustMarket === 'US' ? 'US' : 'TW';
export const trustQuoteKey = asset => {
 const symbol=String(asset?.trustSymbol||'').trim().toUpperCase();
 return trustMarket(asset)==='US'?`US:${symbol}`:symbol;
};
export const trustSymbolValid = (market,symbol) => market==='US'
 ? /^[A-Z][A-Z0-9]*(?:[.-][A-Z0-9]+)?$/.test(symbol) && symbol.length<=12
 : /^[0-9]{4,6}[A-Z]?$/.test(symbol);
export const trustValueTwd=(asset,shares,quote)=>{
 const price=Number(quote?.price), rate=asset?.currency==='TWD'?1:Number(asset?.fxRate);
 return price>0&&rate>0?shares*price*rate:null;
};
