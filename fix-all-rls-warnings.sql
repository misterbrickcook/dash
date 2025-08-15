-- Fix all RLS warnings shown in Supabase dashboard
-- This script enables RLS and creates proper policies for all missing tables

-- 1. Fix deadlines table
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own deadlines" ON deadlines;
DROP POLICY IF EXISTS "Users can insert their own deadlines" ON deadlines;
DROP POLICY IF EXISTS "Users can update their own deadlines" ON deadlines;
DROP POLICY IF EXISTS "Users can delete their own deadlines" ON deadlines;

-- Create policies for deadlines
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

-- 2. Fix links table
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own links" ON links;
DROP POLICY IF EXISTS "Users can insert their own links" ON links;
DROP POLICY IF EXISTS "Users can update their own links" ON links;
DROP POLICY IF EXISTS "Users can delete their own links" ON links;

-- Create policies for links
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

-- 3. Fix notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Create policies for notes
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

-- 4. Fix backup tables (goals_backup, todos_backup)
-- These are backup tables, so we can either drop them or secure them

-- Option A: Secure backup tables (if you want to keep them)
ALTER TABLE goals_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos_backup ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies for backup tables (admin only)
CREATE POLICY "Admin only access to goals_backup" 
ON goals_backup FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin only access to todos_backup" 
ON todos_backup FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Option B: Drop backup tables (uncomment if you don't need them)
-- DROP TABLE IF EXISTS goals_backup;
-- DROP TABLE IF EXISTS todos_backup;

-- 5. Apply the routine_completions fix
-- First, ensure the table exists with proper structure
CREATE TABLE IF NOT EXISTS routine_completions (
    id BIGSERIAL PRIMARY KEY,
    template_id TEXT NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, date, user_id)
);

-- Enable Row Level Security for routine_completions
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own routine completions" ON routine_completions;
DROP POLICY IF EXISTS "Users can insert their own routine completions" ON routine_completions;
DROP POLICY IF EXISTS "Users can update their own routine completions" ON routine_completions;
DROP POLICY IF EXISTS "Users can delete their own routine completions" ON routine_completions;

-- Policy for SELECT: Users can view their own routine completions
CREATE POLICY "Users can view their own routine completions" 
ON routine_completions FOR SELECT 
USING (auth.uid()::UUID = user_id);

-- Policy for INSERT: Users can insert their own routine completions
CREATE POLICY "Users can insert their own routine completions" 
ON routine_completions FOR INSERT 
WITH CHECK (auth.uid()::UUID = user_id);

-- Policy for UPDATE: Users can update their own routine completions
CREATE POLICY "Users can update their own routine completions" 
ON routine_completions FOR UPDATE 
USING (auth.uid()::UUID = user_id)
WITH CHECK (auth.uid()::UUID = user_id);

-- Policy for DELETE: Users can delete their own routine completions
CREATE POLICY "Users can delete their own routine completions" 
ON routine_completions FOR DELETE 
USING (auth.uid()::UUID = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date 
ON routine_completions(user_id, date);

CREATE INDEX IF NOT EXISTS idx_routine_completions_template_date 
ON routine_completions(template_id, date);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_routine_completions_updated_at ON routine_completions;
CREATE TRIGGER update_routine_completions_updated_at 
    BEFORE UPDATE ON routine_completions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Summary
SELECT 'RLS Fix Complete' as status,
       'All tables now have proper Row Level Security enabled' as message;