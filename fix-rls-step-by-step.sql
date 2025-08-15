-- Step-by-step RLS fix - run this after checking table structures
-- This adds missing user_id columns where needed and then applies RLS

-- STEP 1: Add missing user_id columns to tables that need them

-- Add user_id to deadlines table if it doesn't exist
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';

-- Add user_id to links table if it doesn't exist  
ALTER TABLE links ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';

-- Add user_id to notes table if it doesn't exist
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';

-- STEP 2: Enable RLS on all tables (this is safe to run)

ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY; 
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos_backup ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop any existing policies to avoid conflicts

-- Deadlines policies
DROP POLICY IF EXISTS "Users can view their own deadlines" ON deadlines;
DROP POLICY IF EXISTS "Users can insert their own deadlines" ON deadlines;
DROP POLICY IF EXISTS "Users can update their own deadlines" ON deadlines;
DROP POLICY IF EXISTS "Users can delete their own deadlines" ON deadlines;

-- Links policies
DROP POLICY IF EXISTS "Users can view their own links" ON links;
DROP POLICY IF EXISTS "Users can insert their own links" ON links;
DROP POLICY IF EXISTS "Users can update their own links" ON links;
DROP POLICY IF EXISTS "Users can delete their own links" ON links;

-- Notes policies
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Backup table policies
DROP POLICY IF EXISTS "Admin only access to goals_backup" ON goals_backup;
DROP POLICY IF EXISTS "Admin only access to todos_backup" ON todos_backup;

-- STEP 4: Create policies for deadlines table
CREATE POLICY "Users can view their own deadlines" 
ON deadlines FOR SELECT 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can insert their own deadlines" 
ON deadlines FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own deadlines" 
ON deadlines FOR UPDATE 
USING (auth.uid()::text = user_id OR user_id = 'anonymous')
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own deadlines" 
ON deadlines FOR DELETE 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- STEP 5: Create policies for links table
CREATE POLICY "Users can view their own links" 
ON links FOR SELECT 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can insert their own links" 
ON links FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own links" 
ON links FOR UPDATE 
USING (auth.uid()::text = user_id OR user_id = 'anonymous')
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own links" 
ON links FOR DELETE 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- STEP 6: Create policies for notes table
CREATE POLICY "Users can view their own notes" 
ON notes FOR SELECT 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

CREATE POLICY "Users can insert their own notes" 
ON notes FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notes" 
ON notes FOR UPDATE 
USING (auth.uid()::text = user_id OR user_id = 'anonymous')
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own notes" 
ON notes FOR DELETE 
USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- STEP 7: Create restrictive policies for backup tables (admin access only)
CREATE POLICY "Admin only access to goals_backup" 
ON goals_backup FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin only access to todos_backup" 
ON todos_backup FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- STEP 8: Show completion message
SELECT 'RLS Step 1 Complete' as status,
       'All main tables now have RLS enabled. Run routine_completions fix separately.' as message;