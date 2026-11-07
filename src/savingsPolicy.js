/** Savings policy projections are estimates only; never substitute them for book value. */
const asNumber = value => Number(value);
const asDate = value => { const t=Date.parse(`${String(value||'')}T00:00:00Z`); return Number.isFinite(t)?t:NaN; };
export const DAY_MS=86400000;
export function normalizeSavingsProjection(rows=[]){
 if(!Array.isArray(rows)) throw Error('年度試算格式錯誤');
 const found=new Set();
 return rows.map(r=>{
  const year=Number(r.year),endValue=asNumber(r.endValue),nextValue=r.nextValue===''||r.nextValue==null?null:asNumber(r.nextValue);
  const cumulativePremium=r.cumulativePremium===''||r.cumulativePremium==null?null:asNumber(r.cumulativePremium);
  if(!Number.isSafeInteger(year)||year<1||year>150||found.has(year)) throw Error('保單年度需為不重複的正整數');
  if(!Number.isFinite(endValue)||endValue<0||nextValue!==null&&(!Number.isFinite(nextValue)||nextValue<0)||cumulativePremium!==null&&(!Number.isFinite(cumulativePremium)||cumulativePremium<0)) throw Error('試算金額必須是有效的非負數');
  found.add(year);
  return {year,endValue,nextValue,cumulativePremium};
 }).sort((a,b)=>a.year-b.year);
}
export function savingsProjectionComparison(row){
 const base=Number(row.cumulativePremium);
 return row.cumulativePremium==null||!Number.isFinite(base)||base<=0?null:(Number(row.endValue)-base)/base*100;
}
/** Annualized date-based money-weighted return: actual premiums negative, proceeds positive, today's surrender value terminal positive. */
export function savingsCashFlows(flows=[],assetId,valuationDate,valuationAmount){
 const out=[];
 for(const f of flows){
  if(f.assetId!==assetId||!['contribution','redemption','yield'].includes(f.kind))continue;
  const amount=asNumber(f.amount),timestamp=asDate(f.date);
  if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(timestamp)||timestamp>asDate(valuationDate))continue;
  // Fee is denominated in payout account currency; cannot safely subtract it from foreign-currency surrender value.
  out.push({date:f.date,amount:f.kind==='contribution'?-amount:amount});
 }
 const terminal=asNumber(valuationAmount);
 if(Number.isFinite(terminal)&&terminal>=0&&Number.isFinite(asDate(valuationDate)))out.push({date:valuationDate,amount:terminal});
 return out;
}
export function calculateXirr(entries){
 const vals=entries.map(e=>({value:Number(e.amount),date:asDate(e.date)}));
 if(vals.length<2||vals.some(e=>!Number.isFinite(e.value)||!Number.isFinite(e.date))||!vals.some(e=>e.value<0)||!vals.some(e=>e.value>0))return null;
 const start=Math.min(...vals.map(e=>e.date));
 const years=vals.map(e=>(e.date-start)/DAY_MS/365.25);
 if(Math.max(...years)-Math.min(...years)<1/365.25)return null;
 const npv=rate=>vals.reduce((sum,e,i)=>sum+e.value/Math.pow(1+rate,years[i]),0);
 // Find sign-change brackets across a logarithmic range (from near -100% to large positive annual returns).
 let prev=-0.999999,prevValue=npv(prev);
 const roots=[];
 for(let i=1;i<=1200;i++){
  const rate=Math.expm1(Math.log(1e-6)+(Math.log(1e5)-Math.log(1e-6))*i/1200);
  const nextValue=npv(rate);
  if(Number.isFinite(prevValue)&&Number.isFinite(nextValue)&&(prevValue===0||Math.sign(prevValue)!==Math.sign(nextValue))){
   let lo=prev,hi=rate,vlo=prevValue;
   for(let k=0;k<90;k++){const mid=(lo+hi)/2,m=npv(mid);if(Math.sign(m)===Math.sign(vlo)){lo=mid;vlo=m}else hi=mid;}
   roots.push((lo+hi)/2);
  }
  prev=rate;prevValue=nextValue;
 }
 // Multiple solutions are ambiguous; don't display a misleading single IRR.
 return roots.length===1&&Number.isFinite(roots[0])?roots[0]*100:null;
}

/** Paste policy-year estimates as: year, cumulative premiums, year-end surrender,
 * next-year-start surrender. These forecasts never update actual book value. */
export function parseSavingsProjectionText(raw=''){
 const lines=String(raw).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 if(!lines.length)throw Error('請輸入年度試算資料');
 const rows=lines.map((line,index)=>{
  const values=line.split(/[,，\t]/).map(x=>x.trim().replace(/^["']|["']$/g,''));
  if(values.length<3||values.length>4)throw Error(`第 ${index+1} 列請依序輸入年度、累計保費、年末解約金、次年初解約金`);
  return {year:values[0],cumulativePremium:values[1],endValue:values[2],nextValue:values[3]??''};
 });
 return normalizeSavingsProjection(rows);
}
