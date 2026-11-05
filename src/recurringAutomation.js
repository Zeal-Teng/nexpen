// Reliable, opt-in catch-up posting while the PWA is open. No background promises.
import {db, today} from './db.js';

export function nextRecurringDate(date, freq) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw Error('定期排程日期格式錯誤');
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month-1 || d.getDate() !== day) throw Error('定期排程日期無效');
  if (freq === 'weekly') d.setDate(d.getDate() + 7);
  else if (freq === 'yearly') { d.setDate(1); d.setFullYear(d.getFullYear()+1); d.setMonth(month-1); d.setDate(Math.min(day,new Date(d.getFullYear(),month,0).getDate())); }
  else if (freq === 'monthly') { d.setDate(1); d.setMonth(d.getMonth()+1); d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate())); }
  else throw Error('不支援的定期週期');
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function recurringRecord(schedule,date) {
  const common={id:`recurring:${encodeURIComponent(String(schedule.id))}:${date}`,recurringId:schedule.id,date,amount:Number(schedule.amount),note:'定期交易：'+schedule.name};
  if(schedule.type==='transfer')return {...common,type:'transfer',fromAccount:schedule.fromAccount,toAccount:schedule.toAccount,mainCategory:'帳戶互轉',subCategory:'內部轉帳'};
  if(!['income','expense'].includes(schedule.type))throw Error('不支援的定期交易類型');
  return {...common,type:schedule.type,account:schedule.account,mainCategory:schedule.mainCategory,subCategory:schedule.subCategory||''};
}
/** A single atomic occurrence: posting and nextDate advance succeed or fail together.
 * Check schedule afresh within the transaction to prevent duplicate runs in two tabs.
 * Past manually posted records are recognized via recurringId + occurrence date.
 */
export async function postRecurringOccurrence(id,{cutoff=today(),allowFuture=false}={}) {
  return db.transaction('rw',db.recurring,db.records,async()=>{
    const schedule=await db.recurring.get(id);
    if(!schedule)return {posted:false,reason:'missing'};
    const date=schedule.nextDate;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))return {posted:false,reason:'invalid-date'};
    if(!allowFuture&&date>cutoff)return {posted:false,reason:'future'};
    const nextDate=nextRecurringDate(date,schedule.freq);
    const existing=await db.records.where('date').equals(date).filter(r=>r.recurringId===id).first();
    const record=recurringRecord(schedule,date);
    if(!Number.isFinite(record.amount)||record.amount<=0)throw Error('排程金額無效');
    if(!existing&&!await db.records.get(record.id))await db.records.add(record);
    await db.recurring.update(id,{nextDate});
    return {posted:!existing,date,nextDate};
  });
}
export async function runDueRecurring({cutoff=today(),maximum=200}={}) {
  let posted=0,checked=0,remaining=false;
  const due=await db.recurring.where('nextDate').belowOrEqual(cutoff).toArray();
  for (const schedule of due){
    while(checked<maximum){
      const outcome=await postRecurringOccurrence(schedule.id,{cutoff});
      if(!outcome.date)break;
      checked++;
      if(outcome.posted)posted++;
      if(outcome.nextDate>cutoff)break;
    }
    if(checked>=maximum){remaining=true;break;}
  }
  return {posted,remaining};
}
