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

-- 3. Enable Row Level Security (only for existing tables)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create tables that might not exist
CREATE TABLE IF NOT EXISTS routine_templates (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  text TEXT NOT NULL,
  routine_type TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  user_id TEXT DEFAULT 'anonymous'
);

CREATE TABLE IF NOT EXISTS routine_completions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  template_id TEXT REFERENCES routine_templates(id),
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  user_id TEXT DEFAULT 'anonymous',
  UNIQUE(template_id, date, user_id)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  title TEXT,
  mood TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT,
  user_id TEXT DEFAULT 'anonymous',
  UNIQUE(date, type, user_id)
);

-- Enable RLS for all tables
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 4. Drop old open policies if they exist
DROP POLICY IF EXISTS "Allow all access to todos" ON todos;
DROP POLICY IF EXISTS "Allow all access to goals" ON goals;
DROP POLICY IF EXISTS "Allow all access to routine_templates" ON routine_templates;
DROP POLICY IF EXISTS "Allow all access to routine_completions" ON routine_completions;
DROP POLICY IF EXISTS "Allow all access to journal_entries" ON journal_entries;

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

-- 11. Skip sync_test table (not needed for authentication)

-- 12. Insert default routine templates and mark as system
INSERT INTO routine_templates (id, text, routine_type, order_index, user_id) VALUES
('morning_1', '💧 Glas Wasser trinken', 'morning', 1, 'system'),
('morning_2', '🧘 5 Min Meditation', 'morning', 2, 'system'),
('morning_3', '📱 Handy Check vermeiden', 'morning', 3, 'system'),
('morning_4', '☀️ Tageslicht tanken', 'morning', 4, 'system'),
('morning_5', '📝 Tagesplan machen', 'morning', 5, 'system'),
('evening_1', '📱 Handy weggelegen', 'evening', 1, 'system'),
('evening_2', '📖 10 Min lesen', 'evening', 2, 'system'),
('evening_3', '✅ Tag reflektieren', 'evening', 3, 'system'),
('evening_4', '🌙 Zimmer abdunkeln', 'evening', 4, 'system'),
('evening_5', '😴 Früh ins Bett', 'evening', 5, 'system')
ON CONFLICT (id) DO UPDATE SET user_id = 'system';

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