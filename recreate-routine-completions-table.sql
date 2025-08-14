-- STEP 1: Drop existing table completely and start fresh
DROP TABLE IF EXISTS routine_completions CASCADE;

-- STEP 2: Create new table with correct structure
CREATE TABLE routine_completions (
    id BIGSERIAL PRIMARY KEY,
    template_id TEXT NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_template_date UNIQUE(user_id, template_id, date)
);

-- STEP 3: Enable Row Level Security
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create RLS policies
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

-- STEP 5: Create indexes for performance
CREATE INDEX idx_routine_completions_user_date 
ON routine_completions(user_id, date);

CREATE INDEX idx_routine_completions_template_date 
ON routine_completions(template_id, date);

-- STEP 6: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_routine_completions_updated_at 
    BEFORE UPDATE ON routine_completions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 7: Verify table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'routine_completions' 
ORDER BY ordinal_position;