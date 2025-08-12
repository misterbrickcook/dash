-- Fix goals table to have auto-incrementing ID and add missing fields
-- Backup existing data first (if any)
CREATE TABLE IF NOT EXISTS goals_backup AS SELECT * FROM goals;

-- Drop existing table
DROP TABLE IF EXISTS goals CASCADE;

-- Recreate goals table with proper structure
CREATE TABLE goals (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'allgemein',
  completed BOOLEAN DEFAULT FALSE,
  target_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  timeframe TEXT DEFAULT 'monat',
  user_id TEXT DEFAULT 'anonymous'
);

-- Add update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update trigger for goals
CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS for goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create policies for goals
CREATE POLICY "Users can view own goals" ON goals 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own goals" ON goals 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own goals" ON goals 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own goals" ON goals 
    FOR DELETE USING (auth.uid()::text = user_id);

-- Show the new table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;