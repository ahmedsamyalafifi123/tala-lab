// ============================================================================
// HOOK: useLabTests - Manage global lab tests
// ============================================================================

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { LabTest } from '@/types/results';

// Deterministic ordering: display_order, then uuid as a stable tiebreaker
// so duplicate display_order values sort identically on the client and the
// server (Postgres ORDER BY is not stable for ties).
const byOrder = (a: LabTest, b: LabTest) =>
  a.display_order - b.display_order || a.uuid.localeCompare(b.uuid);

export function useLabTests() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all active lab tests
  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('uuid', { ascending: true });

      if (fetchError) throw fetchError;

      setTests(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching lab tests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new test
  const createTest = async (test: Omit<LabTest, 'uuid' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('lab_tests')
        .insert([test])
        .select()
        .single();

      if (createError) throw createError;

      setTests((prev) => [...prev, data].sort(byOrder));
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating test:', err);
      return { data: null, error: err.message };
    }
  };

  // Update an existing test
  const updateTest = async (uuid: string, updates: Partial<LabTest>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('lab_tests')
        .update(updates)
        .eq('uuid', uuid)
        .select()
        .single();

      if (updateError) throw updateError;

      setTests((prev) =>
        prev.map((test) => (test.uuid === uuid ? data : test))
          .sort(byOrder)
      );
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating test:', err);
      return { data: null, error: err.message };
    }
  };

  // Soft delete a test (set is_active = false)
  // Uses the server API route to bypass the RLS WITH CHECK constraint.
  const deleteTest = async (uuid: string) => {
    try {
      const res = await fetch(`/api/lab/tests?uuid=${encodeURIComponent(uuid)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }

      setTests((prev) => prev.filter((test) => test.uuid !== uuid));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting test:', err);
      return { error: err.message };
    }
  };

  // Reorder tests — optimistic local update, persist in background.
  // Avoids toggling loading / refetching so the table doesn't remount
  // and the scroll position is preserved.
  const reorderTests = async (testUpdates: Array<{ uuid: string; display_order: number }>) => {
    const orderMap = new Map(testUpdates.map((u) => [u.uuid, u.display_order]));

    setTests((prev) =>
      prev
        .map((test) =>
          orderMap.has(test.uuid)
            ? { ...test, display_order: orderMap.get(test.uuid)! }
            : test
        )
        .sort(byOrder)
    );

    try {
      const promises = testUpdates.map(({ uuid, display_order }) =>
        supabase
          .from('lab_tests')
          .update({ display_order })
          .eq('uuid', uuid)
      );

      await Promise.all(promises);
      return { error: null };
    } catch (err: any) {
      console.error('Error reordering tests:', err);
      // Resync from server on failure to undo the optimistic change
      await fetchTests();
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  return {
    tests,
    loading,
    error,
    refresh: fetchTests,
    createTest,
    updateTest,
    deleteTest,
    reorderTests,
  };
}
