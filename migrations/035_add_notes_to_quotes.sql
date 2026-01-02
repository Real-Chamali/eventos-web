-- Migration: Add notes column to quotes table
-- Description: Adds a notes column to the quotes table to store additional information about quotes
-- Date: 2024

-- Add notes column to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.quotes.notes IS 'Notas adicionales sobre la cotización';

-- The column is nullable by default, which is correct for optional notes

