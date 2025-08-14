-- STEP 3: Create RLS policies (Alternative with string comparison)
CREATE POLICY "Users can view their own routine completions" 
ON routine_completions FOR SELECT 
USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can insert their own routine completions" 
ON routine_completions FOR INSERT 
WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can update their own routine completions" 
ON routine_completions FOR UPDATE 
USING (auth.uid()::TEXT = user_id::TEXT)
WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can delete their own routine completions" 
ON routine_completions FOR DELETE 
USING (auth.uid()::TEXT = user_id::TEXT);