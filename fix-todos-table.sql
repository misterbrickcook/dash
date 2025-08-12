-- Fix todos table to have auto-incrementing ID
-- First, check current table structure
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'todos' 
ORDER BY ordinal_position;

-- If the id column is not auto-incrementing, we need to fix it
-- Drop and recreate the table with proper structure

-- Backup existing data first (if any)
CREATE TABLE IF NOT EXISTS todos_backup AS SELECT * FROM todos;

-- Drop existing table
DROP TABLE IF EXISTS todos CASCADE;

-- Recreate todos table with proper structure
CREATE TABLE todos (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'privat',
  date DATE,
  time TEXT,
  priority INTEGER DEFAULT 1,
  user_id TEXT DEFAULT 'anonymous',
  due_date TIMESTAMP WITH TIME ZONE
);

-- Add update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update trigger for todos
CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS for todos
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policies for todos
CREATE POLICY "Users can view own todos" ON todos 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own todos" ON todos 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own todos" ON todos 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own todos" ON todos 
    FOR DELETE USING (auth.uid()::text = user_id);

-- Restore backed up data (if any existed)
-- INSERT INTO todos (created_at, updated_at, text, completed, category, date, time, priority, user_id, due_date)
-- SELECT created_at, updated_at, text, completed, category, date, time, priority, user_id, due_date FROM todos_backup;

-- Drop backup table
-- DROP TABLE todos_backup;