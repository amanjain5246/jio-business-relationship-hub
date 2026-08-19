import type { Customer360, Customer360HistoryEntry } from '@/types/models';
import { genId } from '@/utils/format';

const SKIP_FIELDS = new Set(['history', 'accountId', 'fieldMeta']);

export function applyCustomer360Updates(
  c360: Customer360,
  updates: Partial<Customer360>,
  changedBy: string,
  source: string,
): Customer360 {
  const now = new Date().toISOString();
  const newEntries: Customer360HistoryEntry[] = [];

  (Object.keys(updates) as (keyof Customer360)[]).forEach((field) => {
    if (SKIP_FIELDS.has(field as string)) return;
    const nextValue = updates[field];
    if (nextValue === undefined) return;
    const prevValue = c360[field];
    const prevStr = Array.isArray(prevValue) ? prevValue.join(', ') : String(prevValue);
    const nextStr = Array.isArray(nextValue) ? (nextValue as unknown[]).join(', ') : String(nextValue);
    if (prevStr === nextStr) return;
    newEntries.push({
      id: genId('c360h'),
      field: field as string,
      oldValue: prevStr,
      newValue: nextStr,
      changedAt: now,
      changedBy,
      source,
    });
  });

  if (newEntries.length === 0 && !updates.fieldMeta) return c360;

  return {
    ...c360,
    ...updates,
    history: newEntries.length > 0 ? [...newEntries.reverse(), ...(c360.history || [])] : c360.history,
  };
}
