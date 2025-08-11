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

-- 15. Enable public access for now (TEMPORARY - will secure later)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_test ENABLE ROW LEVEL SECURITY;

-- Temporary open policies (will be restricted later with authentication)
CREATE POLICY "Allow all access to todos" ON todos FOR ALL USING (true);
CREATE POLICY "Allow all access to goals" ON goals FOR ALL USING (true);
CREATE POLICY "Allow all access to routine_templates" ON routine_templates FOR ALL USING (true);
CREATE POLICY "Allow all access to routine_completions" ON routine_completions FOR ALL USING (true);
CREATE POLICY "Allow all access to journal_entries" ON journal_entries FOR ALL USING (true);
CREATE POLICY "Allow all access to sync_test" ON sync_test FOR ALL USING (true);