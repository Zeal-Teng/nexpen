// Pure report aggregation: transfer, adjustment and investment-principal records are excluded.
export const reportPeriodKey=(date,period='month')=>{
 const d=String(date||'').slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return '';
 return period==='year'?d.slice(0,4):period==='day'?d:d.slice(0,7);
};
export function aggregateIncomeExpense(rows,{period='month',date='',flow='expense',level='main'}={}){
 const key=reportPeriodKey(date,period);
 const totals={income:0,expense:0,count:0};
 const groups=new Map();const timeline=new Map();
 for(const row of rows||[]){
  if(row?.type!=='income'&&row?.type!=='expense')continue;
  const rowDate=String(row.date||'').slice(0,10);
  if(!key||reportPeriodKey(rowDate,period)!==key)continue;
  const amount=Number(row.reportAmount);
  if(!Number.isFinite(amount)||amount<=0)continue;
  totals[row.type]+=amount;totals.count++;
  const tick=period==='day'?rowDate:period==='month'?rowDate:rowDate.slice(0,7);
  const bucket=timeline.get(tick)||{key:tick,income:0,expense:0};
  bucket[row.type]+=amount;timeline.set(tick,bucket);
  if(row.type!==flow)continue;
  const main=String(row.mainCategory||'未分類');
  const sub=String(row.subCategory||'未分類');
  const name=level==='sub'?sub:main;
  const groupKey=level==='sub'?`${main} / ${sub}`:main;
  const group=groups.get(groupKey)||{name,main,sub:level==='sub'?sub:'',value:0,count:0};
  group.value+=amount;group.count++;
  groups.set(groupKey,group);
 }
 const total=totals[flow]||0;
 return { ...totals, net:totals.income-totals.expense,
  categories:[...groups.values()].sort((a,b)=>b.value-a.value).map(g=>({...g,percent:total?g.value/total*100:0})),
  timeline:[...timeline.values()].sort((a,b)=>a.key.localeCompare(b.key))};
}

// Ratio of expenses to income (percentage). No income means the ratio is undefined.
export function expenseIncomeRatio(income,expense){
 const earned=Number(income), spent=Number(expense);
 return Number.isFinite(earned)&&earned>0&&Number.isFinite(spent)&&spent>=0?spent/earned*100:null;
}

// Detail selection shares exactly the same period/category/timeline rules as aggregation.
export function selectReportEntries(rows,{period='month',date='',kind,flow='expense',level='main',main='',sub='',tick=''}={}){
 const periodKey=reportPeriodKey(date,period);
 if(!periodKey||!['category','timeline'].includes(kind))return [];
 return (rows||[]).filter(row=>{
  if(!['income','expense'].includes(row?.type))return false;
  const rowDate=String(row.date||'').slice(0,10);
  if(reportPeriodKey(rowDate,period)!==periodKey)return false;
  const amount=Number(row.reportAmount);
  if(!Number.isFinite(amount)||amount<=0)return false;
  if(kind==='timeline'){
   const bucket=period==='year'?rowDate.slice(0,7):rowDate;
   return bucket===tick;
  }
  if(row.type!==flow||String(row.mainCategory||'未分類')!==main)return false;
  return level!=='sub'||String(row.subCategory||'未分類')===sub;
 }).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.id||'').localeCompare(String(a.id||'')));
}
