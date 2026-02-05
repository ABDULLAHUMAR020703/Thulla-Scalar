-- ============================================
-- 008_first_trick_column.sql
-- ============================================
-- Tracks first trick state for special rules
-- is_first_trick = true means Ace of Spades rules apply
-- ============================================

-- Add is_first_trick column to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS is_first_trick BOOLEAN DEFAULT TRUE;

-- Comment for documentation
COMMENT ON COLUMN rooms.is_first_trick IS 'True during first trick when Ace of Spades rules apply. Set false after first trick resolves.';
