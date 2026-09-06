-- Clinics (العيادات)
--
-- A lab-scoped directory of referring clinics, managed from إعدادات المعمل and
-- picked on a client. Clients store the clinic's id rather than its name, so
-- renaming a clinic updates every report that references it.
--
-- Idempotent: safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS clinics (
  uuid       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id     uuid NOT NULL REFERENCES labs(uuid) ON DELETE CASCADE,
  name       text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One clinic name per lab. Only live rows take part, so a deleted name is
-- free to be added again.
CREATE UNIQUE INDEX IF NOT EXISTS clinics_lab_name_key
  ON clinics (lab_id, name) WHERE is_active;

CREATE INDEX IF NOT EXISTS clinics_lab_id_idx ON clinics (lab_id);

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Scoped to the labs the signed-in user belongs to, matching clients.
DROP POLICY IF EXISTS "Lab staff can view clinics" ON clinics;
CREATE POLICY "Lab staff can view clinics" ON clinics
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT my_lab_ids()));

DROP POLICY IF EXISTS "Lab staff can insert clinics" ON clinics;
CREATE POLICY "Lab staff can insert clinics" ON clinics
  FOR INSERT TO authenticated
  WITH CHECK (lab_id IN (SELECT my_lab_ids()));

DROP POLICY IF EXISTS "Lab staff can update clinics" ON clinics;
CREATE POLICY "Lab staff can update clinics" ON clinics
  FOR UPDATE TO authenticated
  USING (lab_id IN (SELECT my_lab_ids()))
  WITH CHECK (lab_id IN (SELECT my_lab_ids()));

DROP POLICY IF EXISTS "Lab staff can delete clinics" ON clinics;
CREATE POLICY "Lab staff can delete clinics" ON clinics
  FOR DELETE TO authenticated
  USING (lab_id IN (SELECT my_lab_ids()));

-- Deleting a clinic must not delete patient history; the client keeps its
-- other fields and simply loses the clinic reference.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS clinic_id uuid;

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_clinic_id_fkey;
ALTER TABLE clients ADD CONSTRAINT clients_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES clinics(uuid) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clients_clinic_id_idx ON clients (clinic_id);

COMMIT;
