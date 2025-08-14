-- STEP 1: Create table structure
CREATE TABLE IF NOT EXISTS routine_completions (
    id BIGSERIAL PRIMARY KEY,
    template_id TEXT NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, date, user_id)
);