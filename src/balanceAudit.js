/** Signed ledger adjustment; not income or spending. */
export const balanceAuditDelta = (actual, computed, decimals=2) => {
  const entered=String(actual??'').trim();
  const value=Number(entered), baseline=Number(computed);
  const scale=10**Number(decimals);
  if(!entered||!Number.isFinite(value)||!Number.isFinite(baseline))throw Error('請輸入有效的實際餘額');
  if(!Number.isInteger(decimals)||decimals<0||decimals>6||Math.abs(value*scale-Math.round(value*scale))>1e-6)throw Error(`餘額最多允許 ${decimals} 位小數`);
  const delta=Math.round((value-baseline)*scale)/scale;
  if(!Number.isFinite(delta))throw Error('餘額差異無效');
  return delta;
};
export const isBalanceAudit = (row) => row?.type==='adjustment' && row?.isBalanceAdjustment===true;
