-- Migration: Remove category column from existing visions table
-- Run this if you already have a visions table with category column

-- Remove the category column if it exists
ALTER TABLE public.visions DROP COLUMN IF EXISTS category;

-- Note: This migration is safe to run multiple times
-- The IF EXISTS clause prevents errors if the column is already removed