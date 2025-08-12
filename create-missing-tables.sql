-- Create termine (appointments/dates) table
CREATE TABLE IF NOT EXISTS termine (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT,
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

-- Add update trigger for termine
DROP TRIGGER IF EXISTS update_termine_updated_at ON termine;
CREATE TRIGGER update_termine_updated_at 
    BEFORE UPDATE ON termine
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS for termine
ALTER TABLE termine ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own termine" ON termine;
DROP POLICY IF EXISTS "Users can insert own termine" ON termine;
DROP POLICY IF EXISTS "Users can update own termine" ON termine;
DROP POLICY IF EXISTS "Users can delete own termine" ON termine;

-- Create policies for termine
CREATE POLICY "Users can view own termine" ON termine 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own termine" ON termine 
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own termine" ON termine 
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own termine" ON termine 
    FOR DELETE USING (auth.uid()::text = user_id);