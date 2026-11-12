// A persisted achievement is a user-confirmed snapshot, never recalculated from later market values.
export const dateGapDays=(start,end)=>{
 const parse=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return NaN;const [y,m,d]=value.split('-').map(Number);const time=Date.UTC(y,m-1,d);return new Date(time).toISOString().slice(0,10)===value?time:NaN;};
 const a=parse(start),b=parse(end);
 return Number.isFinite(a)&&Number.isFinite(b)?Math.round((b-a)/86400000):null;
};
export const normalizeGoalMilestones=items=>{
 if(!Array.isArray(items))return [];
 const cleaned=[];
 for(const item of items){
  const amountTwd=Number(item?.amountTwd),achievedDate=item?.achievedDate;
  if(!Number.isFinite(amountTwd)||amountTwd<=0||dateGapDays(achievedDate,achievedDate)!==0)continue;
  if(cleaned.length&&(amountTwd<=cleaned[cleaned.length-1].amountTwd||dateGapDays(cleaned[cleaned.length-1].achievedDate,achievedDate)<0))continue;
  cleaned.push({amountTwd,achievedDate});
 }
 return cleaned;
};
