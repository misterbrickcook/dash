-- MINIMAL AUTHENTICATION SETUP
-- Only add security to existing tables

-- 1. Add user_id column to existing tables
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';

-- 2. Update existing data
UPDATE todos SET user_id = 'anonymous' WHERE user_id IS NULL;
UPDATE goals SET user_id = 'anonymous' WHERE user_id IS NULL;

-- 3. Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing policies
DROP POLICY IF EXISTS "Allow all access to todos" ON todos;
DROP POLICY IF EXISTS "Allow all access to goals" ON goals;

-- 5. Create user-based policies for TODOS
CREATE POLICY "Users can view own todos" ON todos 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own todos" ON todos 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own todos" ON todos 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own todos" ON todos 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 6. Create user-based policies for GOALS  
CREATE POLICY "Users can view own goals" ON goals 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own goals" ON goals 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own goals" ON goals 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own goals" ON goals 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 7. Success
SELECT 'Basic authentication setup complete! Only todos and goals are secured.' as status;