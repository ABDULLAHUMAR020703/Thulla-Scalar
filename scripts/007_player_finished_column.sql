-- ============================================
-- 007_player_finished_column.sql
-- ============================================
-- Adds finished column for player elimination tracking
-- Players with finished=true are removed from turn rotation
-- ============================================

-- Add finished column to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS finished BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_players_finished 
ON players(room_id, finished);

-- Comment for documentation
COMMENT ON COLUMN players.finished IS 'True when player has emptied their hand and is eliminated from turn rotation';
