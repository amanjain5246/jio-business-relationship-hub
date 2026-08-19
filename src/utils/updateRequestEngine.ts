import type { Account, AppData, Customer360, UpdateRequest } from '@/types/models';
import { applyCustomer360Updates } from '@/utils/customer360';

export const TRUST_FIELDS = ['Legal Name', 'GST', 'PAN'] as const;
export type TrustField = (typeof TRUST_FIELDS)[number];

const CUSTOMER360_FIELD_MAP: Record<string, keyof Customer360> = {
  'Legal Name': 'legalName',
  GST: 'gst',
  GSTIN: 'gst',
  PAN: 'pan',
};

const ACCOUNT_FIELD_MAP: Record<string, keyof Account> = {
  ARR: 'arr',
  Health: 'health',
  Segment: 'segment',
  'Relationship Manager': 'relationshipManager',
};

export function currentValueForField(account: Account, c360: Customer360 | undefined, field: string): string {
  const c360Field = CUSTOMER360_FIELD_MAP[field];
  if (c360Field && c360) return String(c360[c360Field]);
  const accountField = ACCOUNT_FIELD_MAP[field];
  if (accountField) return String(account[accountField]);
  return '';
}

/**
 * Applies an approved Update Request's requested value to the account's Customer 360
 * record or Account record (whichever the field belongs to), so every screen reading
 * from shared state reflects the change immediately. Trust-sensitive fields (Legal
 * Name / GST / PAN) also get their fieldMeta marked Verified, since approval through
 * this workflow is what verification means here.
 */
export function applyApprovedValue(data: AppData, req: UpdateRequest, reviewedBy: string): AppData {
  const now = new Date().toISOString();
  const c360Field = CUSTOMER360_FIELD_MAP[req.field];

  if (c360Field) {
    return {
      ...data,
      customer360: data.customer360.map((c) => {
        if (c.accountId !== req.accountId) return c;
        const updated = applyCustomer360Updates(
          c,
          { [c360Field]: req.requestedValue } as Partial<Customer360>,
          reviewedBy,
          'Update Request Approval',
        );
        return {
          ...updated,
          fieldMeta: {
            ...updated.fieldMeta,
            [c360Field]: { source: 'Update Request Approval', lastUpdatedAt: now, verificationStatus: 'Verified' },
          },
        };
      }),
    };
  }

  const accountField = ACCOUNT_FIELD_MAP[req.field];
  if (accountField) {
    return {
      ...data,
      accounts: data.accounts.map((a) => {
        if (a.id !== req.accountId) return a;
        const value = accountField === 'arr' ? Number(req.requestedValue) || a.arr : req.requestedValue;
        return { ...a, [accountField]: value } as Account;
      }),
    };
  }

  return data;
}
