-- Supabase Security Update - Only add authentication policies
-- Run this instead of the full setup if tables already exist

-- 1. Add missing columns if they don't exist
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';
ALTER TABLE routine_templates ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';
ALTER TABLE routine_completions ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';

-- 2. Update existing data to have user_id (temporary - will be user-specific after auth)
UPDATE todos SET user_id = 'anonymous' WHERE user_id IS NULL;
UPDATE goals SET user_id = 'anonymous' WHERE user_id IS NULL;
UPDATE routine_templates SET user_id = 'anonymous' WHERE user_id IS NULL;
UPDATE routine_completions SET user_id = 'anonymous' WHERE user_id IS NULL;
UPDATE journal_entries SET user_id = 'anonymous' WHERE user_id IS NULL;

-- 3. Create sync_test table if it doesn't exist
CREATE TABLE IF NOT EXISTS sync_test (
  id INTEGER PRIMARY KEY,
  checked BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial sync test data
INSERT INTO sync_test (id, checked) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_test ENABLE ROW LEVEL SECURITY;

-- 5. Drop old open policies if they exist
DROP POLICY IF EXISTS "Allow all access to todos" ON todos;
DROP POLICY IF EXISTS "Allow all access to goals" ON goals;
DROP POLICY IF EXISTS "Allow all access to routine_templates" ON routine_templates;
DROP POLICY IF EXISTS "Allow all access to routine_completions" ON routine_completions;
DROP POLICY IF EXISTS "Allow all access to journal_entries" ON journal_entries;
DROP POLICY IF EXISTS "Allow all access to sync_test" ON sync_test;

-- 6. Create secure user-based policies for todos
CREATE POLICY "Users can view own todos" ON todos 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own todos" ON todos 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own todos" ON todos 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own todos" ON todos 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 7. Create secure user-based policies for goals
CREATE POLICY "Users can view own goals" ON goals 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own goals" ON goals 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own goals" ON goals 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own goals" ON goals 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 8. Create secure user-based policies for routine_templates
CREATE POLICY "Users can view own routine_templates" ON routine_templates 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own routine_templates" ON routine_templates 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own routine_templates" ON routine_templates 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own routine_templates" ON routine_templates 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 9. Create secure user-based policies for routine_completions
CREATE POLICY "Users can view own routine_completions" ON routine_completions 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own routine_completions" ON routine_completions 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own routine_completions" ON routine_completions 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own routine_completions" ON routine_completions 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 10. Create secure user-based policies for journal_entries
CREATE POLICY "Users can view own journal_entries" ON journal_entries 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own journal_entries" ON journal_entries 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own journal_entries" ON journal_entries 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own journal_entries" ON journal_entries 
    FOR DELETE USING (auth.uid()::text = user_id);

-- 11. Sync test table - allow authenticated users only
CREATE POLICY "Authenticated users can access sync_test" ON sync_test 
    FOR ALL USING (auth.role() = 'authenticated');

-- 12. Update existing routine templates to system templates
UPDATE routine_templates SET user_id = 'system' WHERE id LIKE 'morning_%' OR id LIKE 'evening_%';

-- 13. Allow all authenticated users to read system templates
CREATE POLICY "Users can view system routine_templates" ON routine_templates 
    FOR SELECT USING (user_id = 'system' AND auth.role() = 'authenticated');

-- 14. Create function to initialize user data on signup
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Copy system routine templates to the new user
    INSERT INTO routine_templates (id, text, routine_type, order_index, user_id)
    SELECT 
        NEW.id::text || '_' || id,
        text,
        routine_type,
        order_index,
        NEW.id::text
    FROM routine_templates 
    WHERE user_id = 'system'
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create trigger to initialize user data on signup
DROP TRIGGER IF EXISTS initialize_user_data_trigger ON auth.users;
CREATE TRIGGER initialize_user_data_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_data();

-- 16. Success message
SELECT 'Authentication security policies successfully installed!' as status;