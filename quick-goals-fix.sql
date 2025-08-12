-- Quick check what columns actually exist in goals table
\d goals;

-- Alternative query if \d doesn't work
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;