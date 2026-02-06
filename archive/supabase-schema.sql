-- ============================================================================
-- MULTI-TENANT LAB MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LABS TABLE - Stores all lab metadata
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS labs (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. LAB USERS TABLE - Links users to labs with roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_users (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID REFERENCES labs(uuid) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'lab_admin', 'lab_staff', 'lab_viewer')),
  is_manager BOOLEAN DEFAULT false, -- True for platform managers
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(lab_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 3. CLIENTS TABLE - Patient records (modified for multi-tenancy)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES labs(uuid) ON DELETE CASCADE,

  -- Patient Information
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_age INTEGER,
  patient_gender TEXT CHECK (patient_gender IN ('male', 'female')),

  -- Daily Sequential ID (per lab)
  daily_id INTEGER NOT NULL,
  daily_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Test Results
  results JSONB DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique daily_id per lab per date
  UNIQUE(lab_id, daily_date, daily_id)
);

-- ----------------------------------------------------------------------------
-- 4. CATEGORIES TABLE - Dynamic test categories (modified for multi-tenancy)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES labs(uuid) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  tests JSONB DEFAULT '[]', -- Array of test objects
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique category name per lab
  UNIQUE(lab_id, name)
);

-- ----------------------------------------------------------------------------
-- 5. AUDIT LOG TABLE - Track all changes (modified for multi-tenancy)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID REFERENCES labs(uuid) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. DAILY ID SEQUENCES TABLE - Track daily IDs per lab
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_id_sequences (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES labs(uuid) ON DELETE CASCADE,
  date DATE NOT NULL,
  last_id INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lab_id, date)
);

-- ----------------------------------------------------------------------------
-- INDEXES - For performance optimization
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clients_lab_id ON clients(lab_id);
CREATE INDEX IF NOT EXISTS idx_clients_daily_date ON clients(daily_date);
CREATE INDEX IF NOT EXISTS idx_clients_daily_id ON clients(daily_id);
CREATE INDEX IF NOT EXISTS idx_categories_lab_id ON categories(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_users_lab_id ON lab_users(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_users_user_id ON lab_users(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_lab_id ON audit_log(lab_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) - Enable on all tables
-- ----------------------------------------------------------------------------
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_id_sequences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Data Isolation & Access Control
-- ============================================================================

-- ----------------------------------------------------------------------------
-- LABS TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Managers can view all labs
CREATE POLICY "Managers can view all labs" ON labs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_users
    WHERE user_id = auth.uid()
    AND is_manager = true
    AND status = 'active'
  )
);

-- Lab users can view their own lab
CREATE POLICY "Lab users can view their lab" ON labs
FOR SELECT TO authenticated
USING (
  uuid IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Only managers can insert labs
CREATE POLICY "Managers can insert labs" ON labs
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lab_users
    WHERE user_id = auth.uid()
    AND is_manager = true
    AND status = 'active'
  )
);

-- Only managers can update labs
CREATE POLICY "Managers can update labs" ON labs
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_users
    WHERE user_id = auth.uid()
    AND is_manager = true
    AND status = 'active'
  )
);

-- Only managers can delete labs
CREATE POLICY "Managers can delete labs" ON labs
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_users
    WHERE user_id = auth.uid()
    AND is_manager = true
    AND status = 'active'
  )
);

-- ----------------------------------------------------------------------------
-- LAB_USERS TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Managers can view all lab users
CREATE POLICY "Managers can view all lab users" ON lab_users
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_users lu
    WHERE lu.user_id = auth.uid()
    AND lu.is_manager = true
    AND lu.status = 'active'
  )
);

-- Lab admins can view users in their lab
CREATE POLICY "Lab admins can view their lab users" ON lab_users
FOR SELECT TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Only managers can insert lab users
CREATE POLICY "Managers can insert lab users" ON lab_users
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lab_users lu
    WHERE lu.user_id = auth.uid()
    AND lu.is_manager = true
    AND lu.status = 'active'
  )
);

-- Only managers can update lab users
CREATE POLICY "Managers can update lab users" ON lab_users
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_users lu
    WHERE lu.user_id = auth.uid()
    AND lu.is_manager = true
    AND lu.status = 'active'
  )
);

-- Only managers can delete lab users
CREATE POLICY "Managers can delete lab users" ON lab_users
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_users lu
    WHERE lu.user_id = auth.uid()
    AND lu.is_manager = true
    AND lu.status = 'active'
  )
);

-- ----------------------------------------------------------------------------
-- CLIENTS TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Lab users can only view clients from their labs
CREATE POLICY "Lab users can view their lab clients" ON clients
FOR SELECT TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Lab admins/staff can insert clients for their lab
CREATE POLICY "Lab admins/staff can insert clients" ON clients
FOR INSERT TO authenticated
WITH CHECK (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role IN ('lab_admin', 'lab_staff')
    AND status = 'active'
  )
);

-- Lab admins/staff can update clients in their lab
CREATE POLICY "Lab admins/staff can update clients" ON clients
FOR UPDATE TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role IN ('lab_admin', 'lab_staff')
    AND status = 'active'
  )
)
WITH CHECK (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role IN ('lab_admin', 'lab_staff')
    AND status = 'active'
  )
);

-- Only lab admins can delete clients
CREATE POLICY "Lab admins can delete clients" ON clients
FOR DELETE TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role = 'lab_admin'
    AND status = 'active'
  )
);

-- ----------------------------------------------------------------------------
-- CATEGORIES TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Lab users can view their lab's categories
CREATE POLICY "Lab users can view their lab categories" ON categories
FOR SELECT TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Lab admins can insert categories for their lab
CREATE POLICY "Lab admins can insert categories" ON categories
FOR INSERT TO authenticated
WITH CHECK (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role = 'lab_admin'
    AND status = 'active'
  )
);

-- Lab admins can update categories in their lab
CREATE POLICY "Lab admins can update categories" ON categories
FOR UPDATE TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role = 'lab_admin'
    AND status = 'active'
  )
);

-- Lab admins can delete categories in their lab
CREATE POLICY "Lab admins can delete categories" ON categories
FOR DELETE TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role = 'lab_admin'
    AND status = 'active'
  )
);

-- ----------------------------------------------------------------------------
-- AUDIT LOG TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Managers can view all audit logs
CREATE POLICY "Managers can view all audit logs" ON audit_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_users lu
    WHERE lu.user_id = auth.uid()
    AND lu.is_manager = true
    AND lu.status = 'active'
  )
);

-- Lab users can view audit logs for their lab
CREATE POLICY "Lab users can view their lab audit logs" ON audit_log
FOR SELECT TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- ----------------------------------------------------------------------------
-- DAILY ID SEQUENCES TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Lab users can view sequences for their lab
CREATE POLICY "Lab users can view their lab sequences" ON daily_id_sequences
FOR SELECT TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Lab users can insert sequences for their lab
CREATE POLICY "Lab users can insert sequences" ON daily_id_sequences
FOR INSERT TO authenticated
WITH CHECK (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Lab users can update sequences in their lab
CREATE POLICY "Lab users can update sequences" ON daily_id_sequences
FOR UPDATE TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: Get next daily ID for a lab
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_next_daily_id(p_lab_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_id INTEGER;
BEGIN
  -- Insert or update the sequence for today
  INSERT INTO daily_id_sequences (lab_id, date, last_id)
  VALUES (p_lab_id, CURRENT_DATE, 1)
  ON CONFLICT (lab_id, date)
  DO UPDATE SET
    last_id = daily_id_sequences.last_id + 1,
    updated_at = NOW()
  RETURNING last_id INTO v_next_id;

  RETURN v_next_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: Auto-assign daily_id when creating a client
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assign_daily_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign the next daily ID for this lab
  NEW.daily_id := get_next_daily_id(NEW.lab_id);
  NEW.daily_date := CURRENT_DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Trigger: Auto-assign daily_id on client insert
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_assign_daily_id ON clients;
CREATE TRIGGER trigger_assign_daily_id
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION assign_daily_id();

-- ----------------------------------------------------------------------------
-- Function: Log changes to audit_log
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_lab_id UUID;
  v_user_id UUID;
BEGIN
  -- Get lab_id from the record
  IF TG_TABLE_NAME = 'clients' THEN
    v_lab_id := COALESCE(NEW.lab_id, OLD.lab_id);
  ELSIF TG_TABLE_NAME = 'categories' THEN
    v_lab_id := COALESCE(NEW.lab_id, OLD.lab_id);
  ELSIF TG_TABLE_NAME = 'lab_users' THEN
    v_lab_id := COALESCE(NEW.lab_id, OLD.lab_id);
  END IF;

  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (lab_id, user_id, action, table_name, record_id, new_values)
    VALUES (v_lab_id, v_user_id, 'create', TG_TABLE_NAME, NEW.uuid, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (lab_id, user_id, action, table_name, record_id, old_values, new_values)
    VALUES (v_lab_id, v_user_id, 'update', TG_TABLE_NAME, NEW.uuid, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (lab_id, user_id, action, table_name, record_id, old_values)
    VALUES (v_lab_id, v_user_id, 'delete', TG_TABLE_NAME, OLD.uuid, to_jsonb(OLD));
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Triggers: Enable audit logging
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS audit_clients ON clients;
CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

DROP TRIGGER IF EXISTS audit_categories ON categories;
CREATE TRIGGER audit_categories
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

DROP TRIGGER IF EXISTS audit_lab_users ON lab_users;
CREATE TRIGGER audit_lab_users
  AFTER INSERT OR UPDATE OR DELETE ON lab_users
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
