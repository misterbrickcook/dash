-- Remove the problematic due_date column that causes timezone issues
ALTER TABLE todos DROP COLUMN IF EXISTS due_date;

-- Check current todos and reset any problematic data
UPDATE todos SET 
    completed = false,
    time = CASE 
        WHEN time = '23:00' THEN '21:00'
        WHEN time = '23:30' THEN '21:30' 
        ELSE time
    END
WHERE completed = false;

-- Show current table structure
\d todos;