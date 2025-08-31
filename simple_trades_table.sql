-- Create simple_trades table for cloud sync
CREATE TABLE simple_trades (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    einsatz TEXT,
    ertrag TEXT,
    notes TEXT,
    date TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS (Row Level Security)
ALTER TABLE simple_trades ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own trades
CREATE POLICY "Users can view own trades" ON simple_trades
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own trades
CREATE POLICY "Users can insert own trades" ON simple_trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own trades
CREATE POLICY "Users can update own trades" ON simple_trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own trades
CREATE POLICY "Users can delete own trades" ON simple_trades
    FOR DELETE USING (auth.uid() = user_id);

-- Optional: Add index for better performance
CREATE INDEX idx_simple_trades_user_id ON simple_trades(user_id);
CREATE INDEX idx_simple_trades_created_at ON simple_trades(created_at DESC);