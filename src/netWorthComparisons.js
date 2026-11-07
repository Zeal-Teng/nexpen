/** Comparisons use recorded daily snapshots, never invent a missing yesterday. */
export function netWorthComparisons(points, range='all') {
 const sorted=(points||[]).filter(p=>/^\d{4}-\d{2}-\d{2}$/.test(p.date)&&Number.isFinite(p.netWorth))
  .slice().sort((a,b)=>a.date.localeCompare(b.date));
 if(!sorted.length)return {visible:[],period:null,daily:null};
 const last=sorted.at(-1);
 let cutoff=null;
 if(range!=='all'){
  const [year,month,day]=last.date.split('-').map(Number);
  const dayUTC=new Date(Date.UTC(year,month-1,day));
  dayUTC.setUTCDate(dayUTC.getUTCDate()-Number(range));
  cutoff=dayUTC.toISOString().slice(0,10);
 }
 const visible=cutoff?sorted.filter(p=>p.date>=cutoff):sorted;
 const compare=(first,end)=>{
  if(!first||!end||first.date===end.date)return null;
  const change=end.netWorth-first.netWorth;
  return {first,last:end,change,pct:first.netWorth===0?null:change/Math.abs(first.netWorth)*100};
 };
 const period=compare(visible[0],visible.at(-1));
 const daily=compare(sorted.at(-2),last);
 if(daily){
  const date=new Date(`${last.date}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate()-1);
  daily.isPreviousDay=sorted.at(-2).date===date.toISOString().slice(0,10);
 }
 return {visible,period,daily};
}
