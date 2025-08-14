-- Fix Row Level Security for routine_completions table
-- This allows authenticated users to insert, update, and select their own routine completions

-- First, ensure the table exists with proper structure
CREATE TABLE IF NOT EXISTS routine_completions (
    id BIGSERIAL PRIMARY KEY,
    template_id TEXT NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, date, user_id)
);

-- Enable Row Level Security
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own routine completions" ON routine_completions;
DROP POLICY IF EXISTS "Users can insert their own routine completions" ON routine_completions;
DROP POLICY IF EXISTS "Users can update their own routine completions" ON routine_completions;
DROP POLICY IF EXISTS "Users can delete their own routine completions" ON routine_completions;

-- Policy for SELECT: Users can view their own routine completions
CREATE POLICY "Users can view their own routine completions" 
ON routine_completions FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for INSERT: Users can insert their own routine completions
CREATE POLICY "Users can insert their own routine completions" 
ON routine_completions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own routine completions
CREATE POLICY "Users can update their own routine completions" 
ON routine_completions FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can delete their own routine completions
CREATE POLICY "Users can delete their own routine completions" 
ON routine_completions FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date 
ON routine_completions(user_id, date);

CREATE INDEX IF NOT EXISTS idx_routine_completions_template_date 
ON routine_completions(template_id, date);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_routine_completions_updated_at ON routine_completions;
CREATE TRIGGER update_routine_completions_updated_at 
    BEFORE UPDATE ON routine_completions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();