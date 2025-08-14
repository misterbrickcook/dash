-- Migration script to add missing columns to goals table
-- Run this in Supabase SQL Editor to complete the smart progress system

-- Add the missing start_value column
ALTER TABLE goals ADD COLUMN IF NOT EXISTS start_value NUMERIC;

-- Add other missing columns that might be needed
ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS timeframe TEXT DEFAULT 'monat';

-- Update any existing goals to have a default start_value of 0 if null
UPDATE goals SET start_value = 0 WHERE start_value IS NULL;

-- Update any existing goals to have completed = false if null  
UPDATE goals SET completed = false WHERE completed IS NULL;

-- Update any existing goals to have timeframe = 'monat' if null
UPDATE goals SET timeframe = 'monat' WHERE timeframe IS NULL;

-- Verify the schema is complete
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;