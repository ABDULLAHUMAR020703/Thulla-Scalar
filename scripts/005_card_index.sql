-- ============================================
-- 005_card_index.sql
-- Add Card Table Structure and Indexes
-- ============================================
-- Creates hands table if not exists, then adds indexes
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create hands table if not exists
CREATE TABLE IF NOT EXISTS hands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    card_suit TEXT NOT NULL,
    card_rank TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add columns if table exists but columns don't
ALTER TABLE hands ADD COLUMN IF NOT EXISTS card_suit TEXT;
ALTER TABLE hands ADD COLUMN IF NOT EXISTS card_rank TEXT;
ALTER TABLE hands ADD COLUMN IF NOT EXISTS room_id UUID;
ALTER TABLE hands ADD COLUMN IF NOT EXISTS player_id UUID;

-- Step 3: Create composite index on suit + rank
CREATE INDEX IF NOT EXISTS idx_hands_suit_rank 
ON hands(card_suit, card_rank);

-- Step 4: Create composite index for room + suit + rank
CREATE INDEX IF NOT EXISTS idx_hands_room_suit_rank 
ON hands(room_id, card_suit, card_rank);

-- Step 5: Create partial index for Ace of Spades specifically
CREATE INDEX IF NOT EXISTS idx_hands_ace_of_spades 
ON hands(room_id, player_id)
WHERE card_suit = 'spades' AND card_rank = 'A';

-- Step 6: Create index for player hand lookups
CREATE INDEX IF NOT EXISTS idx_hands_player 
ON hands(player_id);

-- Step 7: Create composite index for player + room
CREATE INDEX IF NOT EXISTS idx_hands_room_player 
ON hands(room_id, player_id);

-- ============================================
-- CONSTRAINT: Valid Suits and Ranks
-- ============================================
ALTER TABLE hands
DROP CONSTRAINT IF EXISTS hands_suit_check;

ALTER TABLE hands
ADD CONSTRAINT hands_suit_check
CHECK (card_suit IN ('spades', 'hearts', 'diamonds', 'clubs'));

ALTER TABLE hands
DROP CONSTRAINT IF EXISTS hands_rank_check;

ALTER TABLE hands
ADD CONSTRAINT hands_rank_check
CHECK (card_rank IN ('2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'));

-- ============================================
-- VERIFICATION
-- ============================================
-- Check table exists:
-- SELECT * FROM hands LIMIT 1;

-- Check indexes exist:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'hands';
