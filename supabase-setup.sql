-- Supabase Setup SQL for DashFin Dashboard
-- Run these commands in Supabase SQL Editor

-- 1. Enable Row Level Security (but keep open for now, secure later)
-- We'll add authentication later

-- 2. Create todos table
CREATE TABLE todos (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'alle',
  date DATE,
  time TEXT,
  priority INTEGER DEFAULT 1,
  user_id TEXT DEFAULT 'anonymous' -- Will be replaced with real auth later
);

-- 3. Create goals table
CREATE TABLE goals (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- fitness, career, education, personal
  progress INTEGER DEFAULT 0, -- percentage 0-100
  target_value NUMERIC,
  current_value NUMERIC,
  unit TEXT,
  deadline DATE,
  user_id TEXT DEFAULT 'anonymous'
);

-- 4. Create routine_completions table
CREATE TABLE routine_completions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL,
  routine_type TEXT NOT NULL, -- 'morning' or 'evening'
  completed BOOLEAN DEFAULT FALSE,
  user_id TEXT DEFAULT 'anonymous',
  UNIQUE(date, routine_type, user_id)
);

-- 5. Create journal_entries table
CREATE TABLE journal_entries (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL,
  type TEXT NOT NULL, -- 'daily' or 'weekly'
  content TEXT,
  user_id TEXT DEFAULT 'anonymous',
  UNIQUE(date, type, user_id)
);

-- 6. Create sync_test table for testing
CREATE TABLE sync_test (
  id INTEGER PRIMARY KEY,
  checked BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Add update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Create routine templates table
CREATE TABLE routine_templates (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  text TEXT NOT NULL,
  routine_type TEXT NOT NULL, -- 'morning' or 'evening'
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  user_id TEXT DEFAULT 'anonymous'
);

-- 8. Create routine_completions table (updated structure)
DROP TABLE IF EXISTS routine_completions;
CREATE TABLE routine_completions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  template_id TEXT REFERENCES routine_templates(id),
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  user_id TEXT DEFAULT 'anonymous',
  UNIQUE(template_id, date, user_id)
);

-- 9. Update todos table with proper structure
ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
UPDATE todos SET id = 'todo_' || id::text WHERE id::text NOT LIKE 'todo_%';

-- 10. Update goals table with proper structure  
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS start_value NUMERIC;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS timeframe TEXT DEFAULT 'monat';
UPDATE goals SET id = 'goal_' || id::text WHERE id::text NOT LIKE 'goal_%';

-- 11. Update journal_entries table with proper structure
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS mood TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS tags TEXT;
UPDATE journal_entries SET id = 'journal_' || id::text WHERE id::text NOT LIKE 'journal_%';

-- 12. Insert default morning routine templates
INSERT INTO routine_templates (id, text, routine_type, order_index) VALUES
('morning_1', '💧 Glas Wasser trinken', 'morning', 1),
('morning_2', '🧘 5 Min Meditation', 'morning', 2),
('morning_3', '📱 Handy Check vermeiden', 'morning', 3),
('morning_4', '☀️ Tageslicht tanken', 'morning', 4),
('morning_5', '📝 Tagesplan machen', 'morning', 5)
ON CONFLICT (id) DO NOTHING;

-- 13. Insert default evening routine templates  
INSERT INTO routine_templates (id, text, routine_type, order_index) VALUES
('evening_1', '📱 Handy weggelegen', 'evening', 1),
('evening_2', '📖 10 Min lesen', 'evening', 2),
('evening_3', '✅ Tag reflektieren', 'evening', 3),
('evening_4', '🌙 Zimmer abdunkeln', 'evening', 4),
('evening_5', '😴 Früh ins Bett', 'evening', 5)
ON CONFLICT (id) DO NOTHING;

-- 14. Insert initial sync test data
INSERT INTO sync_test (id, checked) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- 15. Enable Row Level Security with user-based policies
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_test ENABLE ROW LEVEL SECURITY;

-- Drop temporary open policies if they exist
DROP POLICY IF EXISTS "Allow all access to todos" ON todos;
DROP POLICY IF EXISTS "Allow all access to goals" ON goals;
DROP POLICY IF EXISTS "Allow all access to routine_templates" ON routine_templates;
DROP POLICY IF EXISTS "Allow all access to routine_completions" ON routine_completions;
DROP POLICY IF EXISTS "Allow all access to journal_entries" ON journal_entries;
DROP POLICY IF EXISTS "Allow all access to sync_test" ON sync_test;

-- Create secure user-based policies for todos
CREATE POLICY "Users can view own todos" ON todos 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own todos" ON todos 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own todos" ON todos 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own todos" ON todos 
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create secure user-based policies for goals
CREATE POLICY "Users can view own goals" ON goals 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own goals" ON goals 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own goals" ON goals 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own goals" ON goals 
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create secure user-based policies for routine_templates
CREATE POLICY "Users can view own routine_templates" ON routine_templates 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own routine_templates" ON routine_templates 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own routine_templates" ON routine_templates 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own routine_templates" ON routine_templates 
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create secure user-based policies for routine_completions
CREATE POLICY "Users can view own routine_completions" ON routine_completions 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own routine_completions" ON routine_completions 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own routine_completions" ON routine_completions 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own routine_completions" ON routine_completions 
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create secure user-based policies for journal_entries
CREATE POLICY "Users can view own journal_entries" ON journal_entries 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own journal_entries" ON journal_entries 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own journal_entries" ON journal_entries 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own journal_entries" ON journal_entries 
    FOR DELETE USING (auth.uid()::text = user_id);

-- Sync test table - allow authenticated users only
CREATE POLICY "Authenticated users can access sync_test" ON sync_test 
    FOR ALL USING (auth.role() = 'authenticated');

-- 16. Update existing data to have proper user_ids for default templates
-- Note: Default routine templates should be copied per user when they first register
-- For now, we'll make them globally accessible by setting user_id to 'system'
UPDATE routine_templates SET user_id = 'system' WHERE id LIKE 'morning_%' OR id LIKE 'evening_%';

-- Create policy to allow all authenticated users to read system templates
CREATE POLICY "Users can view system routine_templates" ON routine_templates 
    FOR SELECT USING (user_id = 'system' AND auth.role() = 'authenticated');

-- 17. Create a function to initialize user data when they first sign up
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
    WHERE user_id = 'system';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize user data on signup
CREATE TRIGGER initialize_user_data_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_data();