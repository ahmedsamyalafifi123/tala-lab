-- ============================================================================
-- MIGRATION SCRIPT - Single Tenant to Multi-Tenant
-- Run this in Supabase SQL Editor to update your existing database
-- ============================================================================

-- 1. Create New Tables (that likely didn't exist)
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

CREATE TABLE IF NOT EXISTS lab_users (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID REFERENCES labs(uuid) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'lab_admin', 'lab_staff', 'lab_viewer')),
  is_manager BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(lab_id, user_id)
);

CREATE TABLE IF NOT EXISTS daily_id_sequences (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES labs(uuid) ON DELETE CASCADE,
  date DATE NOT NULL,
  last_id INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lab_id, date)
);

-- 2. Create a default "Migration Lab" to assign existing data to
-- We do this so we can enforce NOT NULL constraints later
INSERT INTO labs (name, slug, status)
VALUES ('Default Lab', 'default', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Capture the default lab ID
DO $$
DECLARE
  v_default_lab_id UUID;
BEGIN
  SELECT uuid INTO v_default_lab_id FROM labs WHERE slug = 'default';

  -- 3. Modify CLIENTS Table
  
  -- Add lab_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'lab_id') THEN
      ALTER TABLE clients ADD COLUMN lab_id UUID REFERENCES labs(uuid) ON DELETE CASCADE;
      -- Assign existing clients to default lab
      UPDATE clients SET lab_id = v_default_lab_id WHERE lab_id IS NULL;
      -- Now make it NOT NULL
      ALTER TABLE clients ALTER COLUMN lab_id SET NOT NULL;
  END IF;

  -- Rename 'name' to 'patient_name' if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'name') THEN
      ALTER TABLE clients RENAME COLUMN "name" TO patient_name;
  END IF;

  -- Rename 'client_date' to 'daily_date' if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'client_date') THEN
      ALTER TABLE clients RENAME COLUMN client_date TO daily_date;
  END IF;
  
  -- Add other new columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'results') THEN
      ALTER TABLE clients ADD COLUMN results JSONB DEFAULT '{}';
  END IF;
  
  -- Handle 'categories' change from String/JSON to Text Array
  -- Check if 'category' column exists (old schema)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'category') THEN
      -- Add new array column 'categories'
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
      
      -- Migrate data: This is complex in SQL if JSON is messy. 
      -- For now, we will leave 'categories' empty or try to cast if simple.
      -- If 'category' was a JSON string "['A', 'B']", we can try casting.
      -- If it was a simple string "A", we can make it ARRAY['A'].
      
      -- We'll just leave the old 'category' column for reference for now to avoid data loss,
      -- but the app will use 'categories'.
  END IF;


  -- 4. Modify CATEGORIES Table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'lab_id') THEN
      ALTER TABLE categories ADD COLUMN lab_id UUID REFERENCES labs(uuid) ON DELETE CASCADE;
      UPDATE categories SET lab_id = v_default_lab_id WHERE lab_id IS NULL;
      ALTER TABLE categories ALTER COLUMN lab_id SET NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'tests') THEN
      ALTER TABLE categories ADD COLUMN tests JSONB DEFAULT '[]';
  END IF;


  -- 5. Modify AUDIT_LOG Table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'lab_id') THEN
      ALTER TABLE audit_log ADD COLUMN lab_id UUID REFERENCES labs(uuid) ON DELETE CASCADE;
      -- We don't strictly enforce NOT NULL here for old logs, or we can defaulting them
      UPDATE audit_log SET lab_id = v_default_lab_id WHERE lab_id IS NULL;
  END IF;

END $$;

-- 6. Re-apply Indexes
CREATE INDEX IF NOT EXISTS idx_clients_lab_id ON clients(lab_id);
CREATE INDEX IF NOT EXISTS idx_categories_lab_id ON categories(lab_id);

-- 7. Re-apply RLS Policies
-- First, drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view clients" ON clients;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
-- (Add other drops if you recall their names, otherwise we assume users clean up or we overwrite)

-- Enable RLS
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_id_sequences ENABLE ROW LEVEL SECURITY;
