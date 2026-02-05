-- ============================================
-- 004_player_position_index.sql
-- Add Player Position Index
-- ============================================
-- Ensures players.position is indexed for fast turn ordering
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure position column exists
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Step 2: Add NOT NULL constraint
ALTER TABLE players 
ALTER COLUMN position SET NOT NULL;

-- Step 3: Add default value
ALTER TABLE players 
ALTER COLUMN position SET DEFAULT 0;

-- Step 4: Create index on position for sorting
CREATE INDEX IF NOT EXISTS idx_players_position 
ON players(position);

-- Step 5: Create composite index for room + position (most common query)
CREATE INDEX IF NOT EXISTS idx_players_room_position 
ON players(room_id, position);

-- Step 6: Create composite index for active players in position order
CREATE INDEX IF NOT EXISTS idx_players_active_position 
ON players(room_id, is_active, position)
WHERE is_active = true;

-- ============================================
-- UNIQUE CONSTRAINT (Optional)
-- ============================================
-- If each position must be unique within a room:

-- ALTER TABLE players
-- DROP CONSTRAINT IF EXISTS players_room_position_unique;
-- 
-- ALTER TABLE players
-- ADD CONSTRAINT players_room_position_unique
-- UNIQUE (room_id, position);

-- ============================================
-- VERIFICATION
-- ============================================
-- Check indexes exist:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'players';

-- Test query performance:
-- EXPLAIN ANALYZE 
-- SELECT * FROM players 
-- WHERE room_id = 'your-room-id' 
-- ORDER BY position;
