-- Fix the routine_completions table schema
-- The issue is that id should be BIGSERIAL (auto-increment) but the code is trying to insert string IDs

-- Drop the existing table and recreate with correct structure
DROP TABLE IF EXISTS routine_completions CASCADE;

-- Create the table with proper structure
CREATE TABLE routine_completions (
    id BIGSERIAL PRIMARY KEY,  -- Auto-increment, not string
    template_id TEXT NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, date, user_id)  -- This prevents duplicates properly
);

-- Enable Row Level Security
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own routine completions" 
ON routine_completions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routine completions" 
ON routine_completions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine completions" 
ON routine_completions FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine completions" 
ON routine_completions FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date 
ON routine_completions(user_id, date);

CREATE INDEX IF NOT EXISTS idx_routine_completions_template_date 
ON routine_completions(template_id, date);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_routine_completions_updated_at 
    BEFORE UPDATE ON routine_completions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Show completion
SELECT 'Schema Fix Complete' as status,
       'routine_completions table recreated with proper BIGSERIAL id' as message;