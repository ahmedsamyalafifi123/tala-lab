// ============================================================================
// Per-lab test catalogue: merging shared tests with each lab's overrides.
//
// A test row is either shared (lab_id = null, managed by the manager) or owned
// by one lab. A lab customises a shared test through an override holding only
// the fields it changed, plus is_hidden. Everything here is pure so the rules
// can be unit-tested without a database.
// ============================================================================

import type { LabTest, ReferenceRule } from '@/types/results';

/** Fields a lab may change on a shared test. Codes and ownership never change. */
export const OVERRIDABLE_FIELDS = [
  'test_name_ar',
  'test_name_en',
  'category',
  'unit',
  'reference_ranges',
  'display_order',
] as const;

export type OverridableField = (typeof OVERRIDABLE_FIELDS)[number];

/**
 * Changed fields only. A key that is present overrides the shared value, even
 * when its value is null (for example, a lab that clears the unit).
 */
export interface LabTestPatch {
  test_name_ar?: string;
  test_name_en?: string;
  category?: string;
  unit?: string | null;
  reference_ranges?: ReferenceRule[];
  display_order?: number;
}

export interface LabTestOverride {
  lab_id: string;
  test_uuid: string;
  patch: LabTestPatch;
  is_hidden: boolean;
}

/** A test as one lab sees it. */
export type LabTestView = LabTest & {
  source: 'shared' | 'lab';
  /** True when the lab has changed or hidden a shared test. */
  overridden: boolean;
};

const byOrder = (a: LabTest, b: LabTest) =>
  a.display_order - b.display_order || a.uuid.localeCompare(b.uuid);

const hasKey = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

/** Treats undefined, null and '' as the same "no value" for comparisons. */
const normalise = (value: unknown) =>
  value === undefined || value === null || value === '' ? null : value;

const sameValue = (a: unknown, b: unknown) =>
  JSON.stringify(normalise(a)) === JSON.stringify(normalise(b));

function applyPatch(base: LabTest, patch: LabTestPatch): LabTest {
  const next: LabTest = { ...base };
  if (hasKey(patch, 'test_name_ar') && patch.test_name_ar !== undefined) next.test_name_ar = patch.test_name_ar;
  if (hasKey(patch, 'test_name_en') && patch.test_name_en !== undefined) next.test_name_en = patch.test_name_en;
  if (hasKey(patch, 'category') && patch.category !== undefined) next.category = patch.category;
  if (hasKey(patch, 'unit')) next.unit = patch.unit ?? undefined;
  if (hasKey(patch, 'reference_ranges') && patch.reference_ranges !== undefined) {
    next.reference_ranges = patch.reference_ranges;
  }
  if (hasKey(patch, 'display_order') && patch.display_order !== undefined) {
    next.display_order = patch.display_order;
  }
  return next;
}

/** Keeps only overridable fields from an arbitrary update object. */
export function pickOverridable(updates: Partial<LabTest>): LabTestPatch {
  const picked: Record<string, unknown> = {};
  for (const field of OVERRIDABLE_FIELDS) {
    if (hasKey(updates, field)) picked[field] = updates[field];
  }
  return picked as LabTestPatch;
}

/**
 * Next patch after a lab changes some fields of a shared test. A field equal to
 * the shared value is dropped, so the lab keeps only real differences and
 * later manager edits still reach it.
 */
export function buildPatch(
  current: LabTestPatch,
  shared: LabTest,
  changes: LabTestPatch
): LabTestPatch {
  const next: Record<string, unknown> = { ...current };
  for (const field of OVERRIDABLE_FIELDS) {
    if (!hasKey(changes, field)) continue;
    const value = (changes as Record<string, unknown>)[field];
    if (sameValue(value, shared[field])) {
      delete next[field];
    } else {
      next[field] = value;
    }
  }
  return next as LabTestPatch;
}

export function isEmptyPatch(patch: LabTestPatch) {
  return Object.keys(patch).length === 0;
}

/** Only the overrides that belong to this lab; none for the manager view. */
function ownOverrides(overrides: LabTestOverride[], labId: string | null) {
  return labId ? overrides.filter((o) => o.lab_id === labId) : [];
}

/**
 * The catalogue a lab (or the manager, when labId is null) sees.
 *
 * - Shared tests the lab has hidden are dropped.
 * - Shared tests get the lab's overrides applied.
 * - Lab-owned tests are included for their own lab only.
 * - With labId null (manager view), only shared tests are returned.
 */
export function mergeLabTests(
  rows: LabTest[],
  allOverrides: LabTestOverride[],
  labId: string | null
): LabTestView[] {
  const overrides = ownOverrides(allOverrides, labId);
  const overrideByTest = new Map(overrides.map((o) => [o.test_uuid, o]));
  const views: LabTestView[] = [];

  for (const row of rows) {
    if (row.lab_id) {
      if (row.lab_id !== labId) continue;
      views.push({ ...row, source: 'lab', overridden: false });
      continue;
    }

    const override = overrideByTest.get(row.uuid);
    if (override?.is_hidden) continue;

    views.push({
      ...applyPatch(row, override?.patch ?? {}),
      source: 'shared',
      overridden: !!override,
    });
  }

  return views.sort(byOrder);
}

/** Shared tests this lab has hidden, with the lab's overrides applied. */
export function hiddenSharedTests(
  rows: LabTest[],
  allOverrides: LabTestOverride[],
  labId: string | null
): LabTestView[] {
  const overrides = ownOverrides(allOverrides, labId);
  const hidden = new Set(overrides.filter((o) => o.is_hidden).map((o) => o.test_uuid));
  const overrideByTest = new Map(overrides.map((o) => [o.test_uuid, o]));
  return rows
    .filter((row) => !row.lab_id && hidden.has(row.uuid))
    .map((row) => ({
      ...applyPatch(row, overrideByTest.get(row.uuid)?.patch ?? {}),
      source: 'shared' as const,
      overridden: true,
    }))
    .sort(byOrder);
}
