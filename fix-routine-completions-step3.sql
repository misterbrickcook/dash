-- STEP 3: Create RLS policies
CREATE POLICY "Users can view their own routine completions" 
ON routine_completions FOR SELECT 
USING (auth.uid()::UUID = user_id);

CREATE POLICY "Users can insert their own routine completions" 
ON routine_completions FOR INSERT 
WITH CHECK (auth.uid()::UUID = user_id);

CREATE POLICY "Users can update their own routine completions" 
ON routine_completions FOR UPDATE 
USING (auth.uid()::UUID = user_id)
WITH CHECK (auth.uid()::UUID = user_id);

CREATE POLICY "Users can delete their own routine completions" 
ON routine_completions FOR DELETE 
USING (auth.uid()::UUID = user_id);