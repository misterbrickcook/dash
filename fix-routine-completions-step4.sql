-- STEP 4: Create indexes and triggers
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date 
ON routine_completions(user_id, date);

CREATE INDEX IF NOT EXISTS idx_routine_completions_template_date 
ON routine_completions(template_id, date);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_routine_completions_updated_at ON routine_completions;
CREATE TRIGGER update_routine_completions_updated_at 
    BEFORE UPDATE ON routine_completions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();