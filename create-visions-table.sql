-- Create visions table for Vision Board functionality
CREATE TABLE IF NOT EXISTS public.visions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'star',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Remove category column if it exists (migration for existing tables)
ALTER TABLE public.visions DROP COLUMN IF EXISTS category;

-- Enable Row Level Security
ALTER TABLE public.visions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own visions
CREATE POLICY "Users can view own visions" ON public.visions
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own visions
CREATE POLICY "Users can insert own visions" ON public.visions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own visions
CREATE POLICY "Users can update own visions" ON public.visions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own visions
CREATE POLICY "Users can delete own visions" ON public.visions
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS visions_user_id_created_at_idx ON public.visions (user_id, created_at DESC);