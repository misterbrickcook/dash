-- Create journal_tags table for Journal Tag Analytics
CREATE TABLE IF NOT EXISTS public.journal_tags (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    journal_entry_id BIGINT,
    journal_date DATE NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.journal_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for user isolation
CREATE POLICY "Users can view own journal_tags" ON public.journal_tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal_tags" ON public.journal_tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal_tags" ON public.journal_tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal_tags" ON public.journal_tags
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS journal_tags_user_date_idx ON public.journal_tags (user_id, journal_date DESC);
CREATE INDEX IF NOT EXISTS journal_tags_tag_idx ON public.journal_tags (tag);
CREATE INDEX IF NOT EXISTS journal_tags_category_idx ON public.journal_tags (category);