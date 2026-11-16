// src/hooks/use-clinics.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useLabContext } from '@/contexts/LabContext';
import type { Clinic } from '@/types';

const byName = (a: Clinic, b: Clinic) => a.name.localeCompare(b.name, 'ar');

/**
 * The lab's referring clinics.
 *
 * Clients store `clinic_ids`, so every screen that displays a clinic name reads
 * it from `clinicNames` / `clinicLabel` here rather than from the client row: renaming a
 * clinic then updates the client list, the reports and the exports at once.
 *
 * Deletion is a soft delete (`is_active = false`). A clinic that is still
 * referenced by old clients must keep resolving to its name, and the partial
 * unique index frees the name for reuse.
 */
export function useClinics() {
  const { labId } = useLabContext();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchClinics = useCallback(async () => {
    if (!labId) {
      setClinics([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('clinics')
        .select('*')
        .eq('lab_id', labId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setClinics(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'تعذر تحميل العيادات';
      setError(message);
      console.error('Error fetching clinics:', err);
    } finally {
      setLoading(false);
    }
  }, [labId, supabase]);

  const createClinic = async (name: string) => {
    if (!labId) return { data: null, error: 'لا يوجد معمل محدد' };

    try {
      const { data, error: createError } = await supabase
        .from('clinics')
        .insert([{ lab_id: labId, name: name.trim() }])
        .select()
        .single();

      if (createError) throw createError;

      setClinics((prev) => [...prev, data].sort(byName));
      return { data: data as Clinic, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'تعذر إضافة العيادة';
      console.error('Error creating clinic:', err);
      return { data: null, error: message };
    }
  };

  const updateClinic = async (uuid: string, name: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from('clinics')
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq('uuid', uuid)
        .select()
        .single();

      if (updateError) throw updateError;

      setClinics((prev) =>
        prev.map((clinic) => (clinic.uuid === uuid ? data : clinic)).sort(byName)
      );
      return { data: data as Clinic, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'تعذر تحديث العيادة';
      console.error('Error updating clinic:', err);
      return { data: null, error: message };
    }
  };

  const deleteClinic = async (uuid: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('clinics')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('uuid', uuid);

      if (deleteError) throw deleteError;

      setClinics((prev) =>
        prev.map((clinic) =>
          clinic.uuid === uuid ? { ...clinic, is_active: false } : clinic
        )
      );
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'تعذر حذف العيادة';
      console.error('Error deleting clinic:', err);
      return { error: message };
    }
  };

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  /** Clinics offered for selection — deleted ones stay out of the picker. */
  const activeClinics = useMemo(
    () => clinics.filter((clinic) => clinic.is_active),
    [clinics]
  );

  const namesById = useMemo(
    () => new Map(clinics.map((clinic) => [clinic.uuid, clinic.name])),
    [clinics]
  );

  /** Names for stored clinic_ids, including clinics that were deleted. */
  const clinicNames = useCallback(
    (clinicIds?: string[] | null) =>
      (clinicIds ?? []).map((id) => namesById.get(id)).filter((n): n is string => !!n),
    [namesById]
  );

  /** Comma-separated names for a stored clinic_ids list; undefined when empty. */
  const clinicLabel = useCallback(
    (clinicIds?: string[] | null) => {
      const names = clinicNames(clinicIds);
      return names.length > 0 ? names.join("، ") : undefined;
    },
    [clinicNames]
  );

  /** Reverse lookup for Excel import, which carries names rather than ids. */
  const clinicIdsByNames = useCallback(
    (text?: string | null) => {
      if (!text) return [];
      const wanted = text
        .split(/[,،;]/)
        .map((n) => n.trim().toLowerCase())
        .filter(Boolean);
      return activeClinics
        .filter((clinic) => wanted.includes(clinic.name.toLowerCase()))
        .map((clinic) => clinic.uuid);
    },
    [activeClinics]
  );

  return {
    clinics: activeClinics,
    allClinics: clinics,
    loading,
    error,
    refresh: fetchClinics,
    createClinic,
    updateClinic,
    deleteClinic,
    clinicNames,
    clinicLabel,
    clinicIdsByNames,
  };
}
