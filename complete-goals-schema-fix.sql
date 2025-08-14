-- COMPLETE GOALS TABLE SCHEMA FIX
-- Run this in Supabase SQL Editor to add ALL missing columns for Smart Goals System

-- Add all missing columns for smart goals progress system
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_value NUMERIC;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_value NUMERIC; 
ALTER TABLE goals ADD COLUMN IF NOT EXISTS start_value NUMERIC;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS timeframe TEXT DEFAULT 'monat';

-- Update any existing goals to have sensible defaults
UPDATE goals SET 
    target_value = 100 WHERE target_value IS NULL,
    current_value = 0 WHERE current_value IS NULL,
    start_value = 0 WHERE start_value IS NULL,
    unit = '' WHERE unit IS NULL,
    completed = false WHERE completed IS NULL,
    timeframe = 'monat' WHERE timeframe IS NULL;

-- Verify the schema is complete
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;