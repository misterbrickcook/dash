-- STEP 2: Enable RLS and drop existing policies
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own routine completions" ON routine_completions;
DROP POLICY IF EXISTS "Users can insert their own routine completions" ON routine_completions;
DROP POLICY IF EXISTS "Users can update their own routine completions" ON routine_completions;
DROP POLICY IF EXISTS "Users can delete their own routine completions" ON routine_completions;