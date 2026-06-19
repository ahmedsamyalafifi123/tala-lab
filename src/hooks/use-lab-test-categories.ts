// src/hooks/use-lab-test-categories.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { LabTestCategory } from '@/types/results';

// Deterministic ordering: display_order, then uuid as a stable tiebreaker
// so duplicate display_order values sort identically on client and server.
const byOrder = (a: LabTestCategory, b: LabTestCategory) =>
  a.display_order - b.display_order || a.uuid.localeCompare(b.uuid);

export function useLabTestCategories() {
  const [categories, setCategories] = useState<LabTestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('lab_test_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('uuid', { ascending: true });

      if (fetchError) throw fetchError;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching lab test categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (
    cat: Omit<LabTestCategory, 'uuid' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error: createError } = await supabase
        .from('lab_test_categories')
        .insert([cat])
        .select()
        .single();

      if (createError) throw createError;

      setCategories((prev) =>
        [...prev, data].sort(byOrder)
      );
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating category:', err);
      return { data: null, error: err.message };
    }
  };

  const updateCategory = async (uuid: string, updates: Partial<LabTestCategory>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('lab_test_categories')
        .update(updates)
        .eq('uuid', uuid)
        .select()
        .single();

      if (updateError) throw updateError;

      setCategories((prev) =>
        prev
          .map((cat) => (cat.uuid === uuid ? data : cat))
          .sort(byOrder)
      );
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating category:', err);
      return { data: null, error: err.message };
    }
  };

  // Soft-delete via server API route (bypasses RLS WITH CHECK)
  const deleteCategory = async (uuid: string) => {
    try {
      const res = await fetch(
        `/api/lab/test-categories?uuid=${encodeURIComponent(uuid)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }

      setCategories((prev) => prev.filter((cat) => cat.uuid !== uuid));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting category:', err);
      return { error: err.message };
    }
  };

  // Reorder categories — optimistic local update, persist in background.
  // Avoids toggling loading / refetching so the table doesn't remount
  // and the scroll position is preserved.
  const reorderCategories = async (
    categoryUpdates: Array<{ uuid: string; display_order: number }>
  ) => {
    const orderMap = new Map(categoryUpdates.map((u) => [u.uuid, u.display_order]));

    setCategories((prev) =>
      prev
        .map((cat) =>
          orderMap.has(cat.uuid)
            ? { ...cat, display_order: orderMap.get(cat.uuid)! }
            : cat
        )
        .sort(byOrder)
    );

    try {
      const promises = categoryUpdates.map(({ uuid, display_order }) =>
        supabase
          .from('lab_test_categories')
          .update({ display_order })
          .eq('uuid', uuid)
      );

      await Promise.all(promises);
      return { error: null };
    } catch (err: any) {
      console.error('Error reordering categories:', err);
      await fetchCategories();
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refresh: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  };
}
