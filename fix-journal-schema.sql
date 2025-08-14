-- COMPLETE JOURNAL ENTRIES TABLE SCHEMA FIX
-- Run this in Supabase SQL Editor to fix ALL missing columns

-- First, check what columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'journal_entries' 
ORDER BY ordinal_position;

-- Add ALL missing columns to journal_entries table
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_date DATE;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS mood TEXT;

-- Set defaults for existing entries
UPDATE journal_entries SET 
    entry_date = COALESCE(entry_date, CURRENT_DATE),
    user_id = COALESCE(user_id, 'anonymous'),
    tags = COALESCE(tags, ARRAY[]::TEXT[]),
    title = COALESCE(title, 'Untitled Entry'),
    category = COALESCE(category, 'general'),
    mood = COALESCE(mood, '');

-- Verify the final journal_entries schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'journal_entries' 
ORDER BY ordinal_position;