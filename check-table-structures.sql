-- Check the structure of all tables that need RLS
-- Run this first to see what columns exist

-- Check deadlines table structure
SELECT 'deadlines' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'deadlines' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check links table structure  
SELECT 'links' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'links' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check notes table structure
SELECT 'notes' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check backup tables structure
SELECT 'goals_backup' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'goals_backup' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'todos_backup' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'todos_backup' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check routine_completions table structure
SELECT 'routine_completions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'routine_completions' AND table_schema = 'public'
ORDER BY ordinal_position;