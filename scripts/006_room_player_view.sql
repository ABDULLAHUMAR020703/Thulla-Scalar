-- ============================================
-- 006_room_player_view.sql
-- Room Player Count View
-- ============================================
-- Creates table columns if needed, then views for player counting
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure rooms table has required columns
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 4;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_code TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_id UUID;

-- Step 2: Create view for room player counts
DROP VIEW IF EXISTS room_player_counts;

CREATE VIEW room_player_counts AS
SELECT 
    r.id AS room_id,
    r.room_code,
    r.status,
    COALESCE(r.max_players, 4) AS max_players,
    r.host_id,
    COUNT(p.id) FILTER (WHERE p.is_active = true) AS active_player_count,
    COUNT(p.id) AS total_player_count,
    COALESCE(r.max_players, 4) - COUNT(p.id) FILTER (WHERE p.is_active = true) AS spots_available,
    CASE 
        WHEN COUNT(p.id) FILTER (WHERE p.is_active = true) >= COALESCE(r.max_players, 4) 
        THEN true 
        ELSE false 
    END AS is_full,
    CASE 
        WHEN COUNT(p.id) FILTER (WHERE p.is_active = true) = 0 
        THEN true 
        ELSE false 
    END AS is_empty
FROM rooms r
LEFT JOIN players p ON p.room_id = r.id
GROUP BY r.id, r.room_code, r.status, r.max_players, r.host_id;

-- Step 3: Create view for available rooms (waiting + not full)
DROP VIEW IF EXISTS available_rooms;

CREATE VIEW available_rooms AS
SELECT 
    room_id,
    room_code,
    active_player_count,
    max_players,
    spots_available
FROM room_player_counts
WHERE status = 'waiting' 
  AND active_player_count < max_players;

-- Step 4: Create view for active games
DROP VIEW IF EXISTS active_games;

CREATE VIEW active_games AS
SELECT 
    room_id,
    room_code,
    active_player_count,
    max_players,
    host_id
FROM room_player_counts
WHERE status = 'playing';

-- ============================================
-- FUNCTION: Get room with player count
-- ============================================
CREATE OR REPLACE FUNCTION get_room_info(p_room_code TEXT)
RETURNS TABLE (
    room_id UUID,
    room_code TEXT,
    status TEXT,
    max_players INTEGER,
    active_player_count BIGINT,
    is_full BOOLEAN,
    can_join BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rpc.room_id,
        rpc.room_code,
        rpc.status::TEXT,
        rpc.max_players,
        rpc.active_player_count,
        rpc.is_full,
        (rpc.status = 'waiting' AND NOT rpc.is_full) AS can_join
    FROM room_player_counts rpc
    WHERE rpc.room_code = UPPER(p_room_code);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION
-- ============================================
-- Get all room counts:
-- SELECT * FROM room_player_counts;

-- Find available rooms:
-- SELECT * FROM available_rooms;
