-- Migration: Remove category column from crypto_wiki_entries table
-- This removes the category system since filtering is done by tags only

-- Remove the check constraint first
ALTER TABLE crypto_wiki_entries DROP CONSTRAINT IF EXISTS crypto_wiki_entries_category_check;

-- Remove the category column
ALTER TABLE crypto_wiki_entries DROP COLUMN IF EXISTS category;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'crypto_wiki_entries'
ORDER BY ordinal_position;