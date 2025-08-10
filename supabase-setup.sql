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

-- 8. Insert initial sync test data
INSERT INTO sync_test (id, checked) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- 9. Enable public access for now (TEMPORARY - will secure later)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_test ENABLE ROW LEVEL SECURITY;

-- Temporary open policies (will be restricted later with authentication)
CREATE POLICY "Allow all access to todos" ON todos FOR ALL USING (true);
CREATE POLICY "Allow all access to goals" ON goals FOR ALL USING (true);
CREATE POLICY "Allow all access to routine_completions" ON routine_completions FOR ALL USING (true);
CREATE POLICY "Allow all access to journal_entries" ON journal_entries FOR ALL USING (true);
CREATE POLICY "Allow all access to sync_test" ON sync_test FOR ALL USING (true);