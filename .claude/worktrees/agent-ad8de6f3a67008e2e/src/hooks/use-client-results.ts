// ============================================================================
// HOOK: useClientResults - Manage client test results and selected tests
// ============================================================================

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { ClientResults, ResultEntry, TestResult } from '@/types/results';

export function useClientResults(clientUuid: string) {
  const [results, setResults] = useState<ClientResults>({ entries: [] });
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch client results and selected tests
  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('results, selected_tests')
        .eq('uuid', clientUuid)
        .single();

      if (fetchError) throw fetchError;

      // Handle different result formats (empty object {} or proper structure)
      const clientResults = data?.results || {};
      const normalizedResults: ClientResults = {
        entries: Array.isArray(clientResults.entries) ? clientResults.entries : []
      };

      setResults(normalizedResults);
      setSelectedTests(data?.selected_tests || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching client results:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update selected tests (during client creation/editing)
  const updateSelectedTests = async (testCodes: string[]) => {
    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ selected_tests: testCodes })
        .eq('uuid', clientUuid);

      if (updateError) throw updateError;

      setSelectedTests(testCodes);
      return { error: null };
    } catch (err: any) {
      console.error('Error updating selected tests:', err);
      return { error: err.message };
    }
  };

  // Add a new result entry
  const addResultEntry = async (
    tests: Record<string, TestResult>,
    notes?: string,
    recordedBy?: string
  ) => {
    try {
      const newEntry: ResultEntry = {
        entry_id: crypto.randomUUID(),
        recorded_at: new Date().toISOString(),
        recorded_by: recordedBy || '',
        tests,
        notes,
      };

      // Safely handle results.entries (might be undefined if results was {})
      const currentEntries = Array.isArray(results?.entries) ? results.entries : [];

      const updatedResults: ClientResults = {
        entries: [...currentEntries, newEntry],
      };

      const { error: updateError } = await supabase
        .from('clients')
        .update({ results: updatedResults })
        .eq('uuid', clientUuid);

      if (updateError) throw updateError;

      setResults(updatedResults);
      return { data: newEntry, error: null };
    } catch (err: any) {
      console.error('Error adding result entry:', err);
      return { data: null, error: err.message };
    }
  };

  // Update an existing result entry
  const updateResultEntry = async (
    entryId: string,
    tests: Record<string, TestResult>,
    notes?: string
  ) => {
    try {
      const updatedResults: ClientResults = {
        entries: results.entries.map((entry) =>
          entry.entry_id === entryId
            ? { ...entry, tests, notes }
            : entry
        ),
      };

      const { error: updateError } = await supabase
        .from('clients')
        .update({ results: updatedResults })
        .eq('uuid', clientUuid);

      if (updateError) throw updateError;

      setResults(updatedResults);
      return { error: null };
    } catch (err: any) {
      console.error('Error updating result entry:', err);
      return { error: err.message };
    }
  };

  // Delete a result entry
  const deleteResultEntry = async (entryId: string) => {
    try {
      const updatedResults: ClientResults = {
        entries: results.entries.filter((entry) => entry.entry_id !== entryId),
      };

      const { error: updateError } = await supabase
        .from('clients')
        .update({ results: updatedResults })
        .eq('uuid', clientUuid);

      if (updateError) throw updateError;

      setResults(updatedResults);
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting result entry:', err);
      return { error: err.message };
    }
  };

  // Get result entries sorted by date (newest first)
  const getSortedEntries = () => {
    return [...results.entries].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    );
  };

  // Get result entries for a specific test code
  const getTestHistory = (testCode: string) => {
    return results.entries
      .filter((entry) => entry.tests[testCode])
      .map((entry) => ({
        date: entry.recorded_at,
        value: entry.tests[testCode].value,
        flag: entry.tests[testCode].flag,
        unit: entry.tests[testCode].unit,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Get statistics for a test
  const getTestStats = (testCode: string) => {
    const history = getTestHistory(testCode);
    if (history.length === 0) return null;

    const values = history.map((h) => parseFloat(h.value.toString())).filter((v) => !isNaN(v));
    if (values.length === 0) return null;

    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: values.length,
      average: avg,
      min,
      max,
      latest: values[values.length - 1],
    };
  };

  useEffect(() => {
    if (clientUuid) {
      fetchResults();
    }
  }, [clientUuid]);

  return {
    results,
    selectedTests,
    loading,
    error,
    refresh: fetchResults,
    updateSelectedTests,
    addResultEntry,
    updateResultEntry,
    deleteResultEntry,
    getSortedEntries,
    getTestHistory,
    getTestStats,
  };
}
