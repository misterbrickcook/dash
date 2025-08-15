-- Fix ONLY the routine_completions table for routine checkmarks
-- Run this AFTER the step-by-step RLS fix

-- First, check if routine_completions table exists and what structure it has
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'routine_completions') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE routine_completions (
            id BIGSERIAL PRIMARY KEY,
            template_id TEXT NOT NULL,
            date DATE NOT NULL,
            completed BOOLEAN DEFAULT false,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(template_id, date, user_id)
        );
        RAISE NOTICE 'Created routine_completions table with proper structure';
    ELSE
        -- Table exists, check if user_id column exists and has correct type
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'routine_completions' 
                       AND column_name = 'user_id' 
                       AND data_type = 'uuid') THEN
            -- Add or fix user_id column
            -- First drop the column if it exists with wrong type
            BEGIN
                ALTER TABLE routine_completions DROP COLUMN IF EXISTS user_id;
            EXCEPTION WHEN OTHERS THEN
                -- Ignore errors
            END;
            
            -- Add the correct user_id column
            ALTER TABLE routine_completions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added/fixed user_id column in routine_completions table';
        END IF;
    END IF;
END $$;

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

-- Show completion message
SELECT 'Routine Completions RLS Fix Complete' as status,
       'routine_completions table now has proper RLS for routine checkmarks' as message;