// ============================================================================
// HOOK: useTestGroups - Manage global test groups/panels
// ============================================================================

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { TestGroup } from '@/types/results';

export function useTestGroups() {
  const [groups, setGroups] = useState<TestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch all active test groups
  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('test_groups')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      setGroups(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching test groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new test group
  const createGroup = async (group: Omit<TestGroup, 'uuid' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('test_groups')
        .insert([group])
        .select()
        .single();

      if (createError) throw createError;

      setGroups((prev) => [...prev, data].sort((a, b) => a.display_order - b.display_order));
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating group:', err);
      return { data: null, error: err.message };
    }
  };

  // Update an existing test group
  const updateGroup = async (uuid: string, updates: Partial<TestGroup>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('test_groups')
        .update(updates)
        .eq('uuid', uuid)
        .select()
        .single();

      if (updateError) throw updateError;

      setGroups((prev) =>
        prev.map((group) => (group.uuid === uuid ? data : group))
          .sort((a, b) => a.display_order - b.display_order)
      );
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating group:', err);
      return { data: null, error: err.message };
    }
  };

  // Soft delete a test group (set is_active = false)
  const deleteGroup = async (uuid: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('test_groups')
        .update({ is_active: false })
        .eq('uuid', uuid);

      if (deleteError) throw deleteError;

      setGroups((prev) => prev.filter((group) => group.uuid !== uuid));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting group:', err);
      return { error: err.message };
    }
  };

  // Reorder groups
  const reorderGroups = async (groupUpdates: Array<{ uuid: string; display_order: number }>) => {
    try {
      const promises = groupUpdates.map(({ uuid, display_order }) =>
        supabase
          .from('test_groups')
          .update({ display_order })
          .eq('uuid', uuid)
      );

      await Promise.all(promises);

      // Refresh groups
      await fetchGroups();
      return { error: null };
    } catch (err: any) {
      console.error('Error reordering groups:', err);
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    loading,
    error,
    refresh: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
  };
}
