-- Simple Routine System Database Table
-- This creates a clean, simple table for routine tracking

-- Create simple_routines table
CREATE TABLE IF NOT EXISTS simple_routines (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    routine_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per date
    UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE simple_routines ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own routine data
CREATE POLICY "Users can manage their own simple routines" ON simple_routines
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simple_routines_user_date ON simple_routines(user_id, date);
CREATE INDEX IF NOT EXISTS idx_simple_routines_date ON simple_routines(date);

-- Grant necessary permissions
GRANT ALL ON simple_routines TO authenticated;
GRANT USAGE ON SEQUENCE simple_routines_id_seq TO authenticated;

-- Add comment
COMMENT ON TABLE simple_routines IS 'Simplified routine tracking with daily JSON data per user';