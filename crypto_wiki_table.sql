-- Create crypto_wiki_entries table for Crypto Trading Wiki
-- Execute this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS crypto_wiki_entries (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('grundlagen', 'technische-analyse', 'video-learnings', 'trading-rules', 'market-events')),
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crypto_wiki_user_id ON crypto_wiki_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_wiki_category ON crypto_wiki_entries(category);
CREATE INDEX IF NOT EXISTS idx_crypto_wiki_created_at ON crypto_wiki_entries(created_at);

-- Enable Row Level Security
ALTER TABLE crypto_wiki_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own crypto wiki entries" ON crypto_wiki_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own crypto wiki entries" ON crypto_wiki_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crypto wiki entries" ON crypto_wiki_entries
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crypto wiki entries" ON crypto_wiki_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crypto_wiki_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_crypto_wiki_updated_at
    BEFORE UPDATE ON crypto_wiki_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_crypto_wiki_updated_at();