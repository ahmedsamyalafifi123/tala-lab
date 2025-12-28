-- =====================================================
-- حالات معمل عيادة تلا - Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Clients table with daily sequential ID
-- ID format: daily_number (1, 2, 3... resets each day)
CREATE TABLE clients (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_id INTEGER NOT NULL,
  client_date DATE DEFAULT CURRENT_DATE,
  name TEXT NOT NULL,
  notes TEXT,
  category TEXT CHECK (category IN ('صحة مدرسية', 'cbc')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(client_date, daily_id)
);

-- Function to auto-generate daily_id
CREATE OR REPLACE FUNCTION generate_daily_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(daily_id), 0) + 1 INTO NEW.daily_id
  FROM clients
  WHERE client_date = NEW.client_date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign daily_id on insert
CREATE TRIGGER set_daily_id
BEFORE INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION generate_daily_id();

-- Audit log for tracking changes
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policies - All authenticated users can read/write
CREATE POLICY "Anyone can view clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update clients" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anyone can delete clients" ON clients FOR DELETE TO authenticated USING (true);

CREATE POLICY "Anyone can view audit_log" ON audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert audit_log" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_clients_date ON clients(client_date DESC);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
