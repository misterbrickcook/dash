-- NUCLEAR OPTION: Delete all todos and start fresh
DELETE FROM todos;

-- Or if you want to keep some, at least fix the mess:
-- UPDATE todos SET time = '21:00', completed = false;

-- Check what's left
SELECT * FROM todos;