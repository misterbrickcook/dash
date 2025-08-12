-- Remove the problematic due_date column that causes timezone issues
ALTER TABLE todos DROP COLUMN IF EXISTS due_date;

-- Fix all messed up times back to 21:00
UPDATE todos SET 
    time = CASE 
        WHEN time = '23:00' THEN '21:00'
        WHEN time = '02:00' THEN '21:00'
        WHEN time = '01:00' THEN '21:00'
        WHEN time = '00:00' THEN '21:00'
        WHEN time LIKE '%:00' AND time != '21:00' THEN '21:00'
        ELSE time
    END;

-- Reset all todos to not completed
UPDATE todos SET completed = false;

-- Show current table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'todos' 
ORDER BY ordinal_position;

-- Show current todos data
SELECT id, text, completed, date, time, created_at FROM todos LIMIT 10;