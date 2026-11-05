/** Resolve the diary title without exposing the legacy generated schedule prefix.
 * Keep the original record and recurrence identity intact for auditing/deduplication.
 */
export function diaryTransactionTitle(record, fallback='') {
  const note=String(record?.note||'').trim();
  const isAutomatic=Boolean(record?.recurringId)||String(record?.id||'').startsWith('recurring:');
  const generatedLegacyNote=isAutomatic&&note.startsWith('定期交易：');
  return (!generatedLegacyNote&&note)||record?.subCategory||record?.mainCategory||fallback;
}
