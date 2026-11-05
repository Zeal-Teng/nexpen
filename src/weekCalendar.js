// Display-only week navigation. Dates stay in YYYY-MM-DD and are never migrated.
export function weekDatesFor(date, startsOn = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return [];
  const anchor = new Date(`${date}T12:00:00`);
  if (!Number.isFinite(anchor.getTime())) return [];
  const first = startsOn === 1 ? 1 : 0;
  anchor.setDate(anchor.getDate() - ((anchor.getDay() - first + 7) % 7));
  return Array.from({length: 7}, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}
