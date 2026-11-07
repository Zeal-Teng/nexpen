/** Dated valuations are references; portfolio conversions always use current FX. */
export const productTwdRate = product => product?.currency==='TWD'?1:(Number(product?.currentFxRate)>0?Number(product.currentFxRate):NaN); // Never treat dated historical reference FX as today's rate.
export function valuationRows(product){
 const rows=Array.isArray(product?.valuationHistory)?product.valuationHistory:[];
 if(rows.length)return rows.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 // Existing portfolios had a single price/date on the asset itself; preserve it without a migration.
 return product?.priceDate&&Number.isFinite(Number(product.price))?[{id:'legacy',date:product.priceDate,price:Number(product.price),fxRate:Number(product.fxRate)||1,fxDate:product.fxDate||'',legacy:true}]:[];
}
export function productWithValuations(product,rows){
 const sorted=rows.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 const latest=sorted[0];
 return {...product,valuationHistory:sorted,price:latest?Number(latest.price):0,priceDate:latest?.date||'',fxRate:latest?.fxRate||product.fxRate||1,fxDate:latest?.fxDate||'',fxSource:latest?.fxSource||''};
}
