// ============================================================================
// HOOK: lab test catalogue
//
// - mode 'manager': the shared catalogue (lab_id null). Edits change the shared
//   row, so every lab sees them unless it has overridden that field.
// - mode 'lab': what one lab sees. Shared tests come with that lab's overrides
//   applied, plus the lab's own tests. Edits to a shared test are stored as an
//   override, never as a change to the shared row.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useLabContext } from '@/contexts/LabContext';
import type { LabTest } from '@/types/results';
import {
  buildPatch,
  hiddenSharedTests,
  isEmptyPatch,
  mergeLabTests,
  pickOverridable,
  type LabTestOverride,
  type LabTestPatch,
  type LabTestView,
} from '@/lib/lab-tests';

export type LabTestCatalogMode = 'manager' | 'lab';

export type NewLabTest = Omit<LabTest, 'uuid' | 'created_at' | 'updated_at' | 'lab_id'>;

interface CatalogOptions {
  mode: LabTestCatalogMode;
  /** Required in 'lab' mode; ignored in 'manager' mode. */
  labId: string | null;
}

type Result<T> = { data: T | null; error: string | null };

const errorMessage = (err: unknown, fallback: string) =>
  (err as { message?: string } | null)?.message || fallback;

export function useLabTestCatalog({ mode, labId }: CatalogOptions) {
  const supabase = useMemo(() => createClient(), []);
  const isLab = mode === 'lab';
  const scopeLabId = isLab ? labId : null;

  const [rows, setRows] = useState<LabTest[]>([]);
  const [overrides, setOverrides] = useState<LabTestOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  // Silent after the first load, so writes do not flash a spinner or remount
  // the table and lose its scroll position.
  const refresh = useCallback(async () => {
    if (isLab && !labId) {
      setRows([]);
      setOverrides([]);
      setLoading(false);
      return;
    }

    try {
      if (!loadedOnce.current) setLoading(true);
      setError(null);

      const { data: testRows, error: testsError } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('uuid', { ascending: true });
      if (testsError) throw testsError;

      let overrideRows: LabTestOverride[] = [];
      if (isLab && labId) {
        const { data, error: overridesError } = await supabase
          .from('lab_test_overrides')
          .select('lab_id, test_uuid, patch, is_hidden')
          .eq('lab_id', labId);
        if (overridesError) throw overridesError;
        overrideRows = (data as LabTestOverride[]) ?? [];
      }

      setRows((testRows as LabTest[]) ?? []);
      setOverrides(overrideRows);
      loadedOnce.current = true;
    } catch (err) {
      setError(errorMessage(err, 'تعذر تحميل التحاليل'));
      console.error('Error fetching lab tests:', err);
    } finally {
      setLoading(false);
    }
  }, [isLab, labId, supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sharedByUuid = useMemo(
    () => new Map(rows.filter((row) => !row.lab_id).map((row) => [row.uuid, row])),
    [rows]
  );
  const overrideByUuid = useMemo(
    () => new Map(overrides.map((o) => [o.test_uuid, o])),
    [overrides]
  );

  const tests: LabTestView[] = useMemo(
    () => mergeLabTests(rows, overrides, scopeLabId),
    [rows, overrides, scopeLabId]
  );

  const hiddenTests: LabTestView[] = useMemo(
    () => (isLab ? hiddenSharedTests(rows, overrides, labId) : []),
    [isLab, labId, rows, overrides]
  );

  /** Writes or clears this lab's override row for a shared test. */
  const saveOverride = async (
    testUuid: string,
    patch: LabTestPatch,
    isHidden: boolean
  ) => {
    if (!labId) throw new Error('لا يوجد معمل محدد');

    if (isEmptyPatch(patch) && !isHidden) {
      const { error: deleteError } = await supabase
        .from('lab_test_overrides')
        .delete()
        .eq('lab_id', labId)
        .eq('test_uuid', testUuid);
      if (deleteError) throw deleteError;
      return;
    }

    const { error: upsertError } = await supabase
      .from('lab_test_overrides')
      .upsert(
        {
          lab_id: labId,
          test_uuid: testUuid,
          patch,
          is_hidden: isHidden,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'lab_id,test_uuid' }
      );
    if (upsertError) throw upsertError;
  };

  const createTest = async (test: NewLabTest): Promise<Result<LabTest>> => {
    if (isLab && !labId) return { data: null, error: 'لا يوجد معمل محدد' };

    try {
      const { data, error: createError } = await supabase
        .from('lab_tests')
        .insert([{ ...test, lab_id: scopeLabId }])
        .select()
        .single();
      if (createError) throw createError;

      await refresh();
      return { data: data as LabTest, error: null };
    } catch (err) {
      console.error('Error creating test:', err);
      return { data: null, error: errorMessage(err, 'تعذر إضافة التحليل') };
    }
  };

  /**
   * Updates a test. For a shared test in lab mode, only the fields that differ
   * from the shared value are stored as this lab's override.
   */
  const updateTest = async (uuid: string, updates: Partial<LabTest>): Promise<Result<null>> => {
    try {
      const shared = sharedByUuid.get(uuid);

      if (isLab && shared) {
        const current = overrideByUuid.get(uuid);
        const patch = buildPatch(current?.patch ?? {}, shared, pickOverridable(updates));
        await saveOverride(uuid, patch, current?.is_hidden ?? false);
      } else {
        const { error: updateError } = await supabase
          .from('lab_tests')
          .update(updates)
          .eq('uuid', uuid);
        if (updateError) throw updateError;
      }

      await refresh();
      return { data: null, error: null };
    } catch (err) {
      console.error('Error updating test:', err);
      return { data: null, error: errorMessage(err, 'تعذر تحديث التحليل') };
    }
  };

  /**
   * Removes a test from this catalogue. A shared test is hidden for this lab
   * only; a lab's own test is soft-deleted (is_active = false).
   */
  const deleteTest = async (uuid: string): Promise<Result<null>> => {
    try {
      if (isLab && sharedByUuid.has(uuid)) {
        const current = overrideByUuid.get(uuid);
        await saveOverride(uuid, current?.patch ?? {}, true);
      } else {
        // No .select(): the row is no longer active, so it would fail the
        // SELECT policy on the returned row.
        const { error: deleteError } = await supabase
          .from('lab_tests')
          .update({ is_active: false })
          .eq('uuid', uuid);
        if (deleteError) throw deleteError;
      }

      await refresh();
      return { data: null, error: null };
    } catch (err) {
      console.error('Error deleting test:', err);
      return { data: null, error: errorMessage(err, 'تعذر حذف التحليل') };
    }
  };

  /** Drops this lab's changes to a shared test and unhides it. */
  const resetTest = async (uuid: string): Promise<Result<null>> => {
    try {
      await saveOverride(uuid, {}, false);
      await refresh();
      return { data: null, error: null };
    } catch (err) {
      console.error('Error resetting test:', err);
      return { data: null, error: errorMessage(err, 'تعذر استعادة التحليل') };
    }
  };

  /** Persists new display orders; shared tests store them as overrides. */
  const reorderTests = async (
    updates: Array<{ uuid: string; display_order: number }>
  ): Promise<Result<null>> => {
    try {
      if (isLab && !labId) throw new Error('لا يوجد معمل محدد');

      const upserts: Array<{
        lab_id: string;
        test_uuid: string;
        patch: LabTestPatch;
        is_hidden: boolean;
        updated_at: string;
      }> = [];
      const clears: string[] = [];

      const ownUpdates = updates.filter(({ uuid }) => !(isLab && sharedByUuid.has(uuid)));
      const sharedUpdates = updates.filter(({ uuid }) => isLab && sharedByUuid.has(uuid));

      for (const { uuid, display_order } of sharedUpdates) {
        const shared = sharedByUuid.get(uuid)!;
        const current = overrideByUuid.get(uuid);
        const patch = buildPatch(current?.patch ?? {}, shared, { display_order });
        if (isEmptyPatch(patch) && !current?.is_hidden) {
          clears.push(uuid);
        } else {
          upserts.push({
            lab_id: labId!,
            test_uuid: uuid,
            patch,
            is_hidden: current?.is_hidden ?? false,
            updated_at: new Date().toISOString(),
          });
        }
      }

      if (upserts.length > 0) {
        const { error: upsertError } = await supabase
          .from('lab_test_overrides')
          .upsert(upserts, { onConflict: 'lab_id,test_uuid' });
        if (upsertError) throw upsertError;
      }

      if (clears.length > 0) {
        const { error: clearError } = await supabase
          .from('lab_test_overrides')
          .delete()
          .eq('lab_id', labId!)
          .in('test_uuid', clears);
        if (clearError) throw clearError;
      }

      await Promise.all(
        ownUpdates.map(({ uuid, display_order }) =>
          supabase.from('lab_tests').update({ display_order }).eq('uuid', uuid).then(({ error: e }) => {
            if (e) throw e;
          })
        )
      );

      await refresh();
      return { data: null, error: null };
    } catch (err) {
      console.error('Error reordering tests:', err);
      await refresh();
      return { data: null, error: errorMessage(err, 'تعذر حفظ الترتيب') };
    }
  };

  return {
    tests,
    hiddenTests,
    loading,
    error,
    isLab,
    refresh,
    createTest,
    updateTest,
    deleteTest,
    resetTest,
    reorderTests,
  };
}

/** The current lab's catalogue. Must be used inside a LabProvider. */
export function useLabTests() {
  const { labId } = useLabContext();
  return useLabTestCatalog({ mode: 'lab', labId });
}
