-- Migration: Add display_order column to existing visions table
-- Run this if you already have a visions table without display_order column

-- Add display_order column if it doesn't exist
ALTER TABLE public.visions ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing visions with display_order based on created_at (optional)
-- This gives existing visions a proper order based on when they were created
UPDATE public.visions 
SET display_order = subquery.row_number 
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS row_number
    FROM public.visions 
    WHERE display_order IS NULL OR display_order = 0
) AS subquery 
WHERE public.visions.id = subquery.id AND (public.visions.display_order IS NULL OR public.visions.display_order = 0);

-- Note: This migration is safe to run multiple times
-- The IF NOT EXISTS clause prevents errors if the column already exists