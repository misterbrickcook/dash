-- Check the current goals table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;

-- Show sample data if any exists
SELECT * FROM goals LIMIT 5;