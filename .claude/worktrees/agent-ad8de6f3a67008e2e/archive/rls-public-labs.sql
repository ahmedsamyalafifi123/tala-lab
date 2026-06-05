-- ============================================================================
-- RLS FIX PART 3: PUBLIC ACCESS FOR LAB LOOKUP
-- ============================================================================
-- The login page and layout need to read basic lab details (name, slug) 
-- BEFORE the user is authenticated.
-- We must allow public read access to active labs.
-- ============================================================================

CREATE POLICY "Public can view active labs" ON labs
FOR SELECT TO anon, authenticated
USING (status = 'active');
