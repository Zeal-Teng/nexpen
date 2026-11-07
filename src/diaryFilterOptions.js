import { diaryAccountIds, matchesDiaryAccount } from './diaryAccountFilter.js';

// Derived from the actual diary rows (including virtual stock rows), rather than
// from the full account list or a hard-coded list of transaction kinds.
export function diaryFilterType(record) {
  if (record?.isStockDividend || record?.isStockTrade || record?.type === 'stock') return 'stock';
  return record?.type || '';
}

export function matchesDiaryType(record, selectedType) {
  return selectedType === 'all' || diaryFilterType(record) === selectedType;
}

export function availableDiaryFilters(records, accounts, selectedType = 'all', selectedAccount = 'all') {
  const typeCandidates = records.filter(row => matchesDiaryAccount(row, selectedAccount, accounts));
  const accountCandidates = records.filter(row => matchesDiaryType(row, selectedType));
  const presentTypes = new Set(typeCandidates.map(diaryFilterType));
  const presentAccountIds = new Set(accountCandidates.flatMap(diaryAccountIds));
  return {
    types: ['expense', 'income', 'transfer', 'stock', 'investment', 'adjustment'].filter(type => presentTypes.has(type)),
    accounts: accounts.filter(account => presentAccountIds.has(String(account.id))),
  };
}
