// ============================================================================
// HOOK: useLabTests - Manage global lab tests
// ============================================================================

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { LabTest } from '@/types/results';

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
        .order('display_order', { ascending: true });

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

      setTests((prev) => [...prev, data].sort((a, b) => a.display_order - b.display_order));
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
          .sort((a, b) => a.display_order - b.display_order)
      );
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating test:', err);
      return { data: null, error: err.message };
    }
  };

  // Soft delete a test (set is_active = false)
  const deleteTest = async (uuid: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('lab_tests')
        .update({ is_active: false })
        .eq('uuid', uuid);

      if (deleteError) throw deleteError;

      setTests((prev) => prev.filter((test) => test.uuid !== uuid));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting test:', err);
      return { error: err.message };
    }
  };

  // Reorder tests
  const reorderTests = async (testUpdates: Array<{ uuid: string; display_order: number }>) => {
    try {
      const promises = testUpdates.map(({ uuid, display_order }) =>
        supabase
          .from('lab_tests')
          .update({ display_order })
          .eq('uuid', uuid)
      );

      await Promise.all(promises);

      // Refresh tests
      await fetchTests();
      return { error: null };
    } catch (err: any) {
      console.error('Error reordering tests:', err);
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
