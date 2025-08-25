-- Create trading_rules table for Trading Rules functionality
CREATE TABLE IF NOT EXISTS public.trading_rules (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.trading_rules ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own trading rules
CREATE POLICY "Users can view own trading_rules" ON public.trading_rules
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own trading rules
CREATE POLICY "Users can insert own trading_rules" ON public.trading_rules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own trading rules
CREATE POLICY "Users can update own trading_rules" ON public.trading_rules
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own trading rules
CREATE POLICY "Users can delete own trading_rules" ON public.trading_rules
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS trading_rules_user_id_created_at_idx ON public.trading_rules (user_id, created_at DESC);