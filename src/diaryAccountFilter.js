// Keep diary rows and period summary aligned. Ordinary records have one
// owning account; only transfers may belong to two accounts.
export const diaryAccountIds = (record) => {
  if (!record || typeof record !== 'object') return [];
  const ids = record.type === 'transfer'
    ? [record.fromAccount, record.toAccount]
    : [record.account];
  return ids.filter(id => id !== null && id !== undefined && String(id).trim() !== '').map(String);
};

export function matchesDiaryAccount(record, selectedId, accounts) {
  if (selectedId === 'all') return true;
  if (selectedId === null || selectedId === undefined || String(selectedId).trim() === '') return false;
  // Do not silently revert to all records when an account was deleted.
  if (!accounts.some(a => String(a.id) === String(selectedId))) return false;
  return diaryAccountIds(record).includes(String(selectedId));
}

export const filterDiaryByAccount = (records, selectedId, accounts) =>
  records.filter(record => matchesDiaryAccount(record, selectedId, accounts));
