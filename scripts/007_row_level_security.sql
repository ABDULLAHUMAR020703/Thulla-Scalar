-- ============================================
-- 007_row_level_security.sql
-- Row Level Security Policies for Thulla
-- ============================================
-- Secures all multiplayer tables
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Ensure required columns exist
-- ============================================

ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_id UUID;

-- ============================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE hands ENABLE ROW LEVEL SECURITY;

-- Create game_events table if not exists
CREATE TABLE IF NOT EXISTS game_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER: Get user's room IDs
-- ============================================

CREATE OR REPLACE FUNCTION get_user_room_ids()
RETURNS SETOF UUID AS $$
    SELECT room_id FROM players WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- ROOMS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "rooms_select" ON rooms;
DROP POLICY IF EXISTS "rooms_insert" ON rooms;
DROP POLICY IF EXISTS "rooms_update" ON rooms;
DROP POLICY IF EXISTS "rooms_delete" ON rooms;

-- Players can read rooms they belong to
CREATE POLICY "rooms_select" ON rooms
FOR SELECT USING (
    id IN (SELECT get_user_room_ids())
    OR status = 'waiting'
);

-- Authenticated users can create rooms
CREATE POLICY "rooms_insert" ON rooms
FOR INSERT WITH CHECK (
    auth.uid() = host_id
);

-- Only host can update room
CREATE POLICY "rooms_update" ON rooms
FOR UPDATE USING (
    auth.uid() = host_id
);

-- Only host can delete room
CREATE POLICY "rooms_delete" ON rooms
FOR DELETE USING (
    auth.uid() = host_id
);

-- ============================================
-- PLAYERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "players_select" ON players;
DROP POLICY IF EXISTS "players_insert" ON players;
DROP POLICY IF EXISTS "players_update" ON players;
DROP POLICY IF EXISTS "players_delete" ON players;

-- Players can read all players in their room
CREATE POLICY "players_select" ON players
FOR SELECT USING (
    room_id IN (SELECT get_user_room_ids())
);

-- Players can insert themselves
CREATE POLICY "players_insert" ON players
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- Players can only update their own record
CREATE POLICY "players_update" ON players
FOR UPDATE USING (
    auth.uid() = user_id
);

-- Players can only delete themselves
CREATE POLICY "players_delete" ON players
FOR DELETE USING (
    auth.uid() = user_id
);

-- ============================================
-- HANDS TABLE POLICIES (MOST RESTRICTIVE)
-- ============================================

DROP POLICY IF EXISTS "hands_select" ON hands;
DROP POLICY IF EXISTS "hands_insert" ON hands;
DROP POLICY IF EXISTS "hands_update" ON hands;
DROP POLICY IF EXISTS "hands_delete" ON hands;

-- Players can ONLY read their own cards
CREATE POLICY "hands_select" ON hands
FOR SELECT USING (
    player_id IN (
        SELECT id FROM players WHERE user_id = auth.uid()
    )
);

-- Only service role can insert
CREATE POLICY "hands_insert" ON hands
FOR INSERT WITH CHECK (false);

-- Only service role can update
CREATE POLICY "hands_update" ON hands
FOR UPDATE USING (false);

-- Only service role can delete
CREATE POLICY "hands_delete" ON hands
FOR DELETE USING (false);

-- ============================================
-- GAME_EVENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "game_events_select" ON game_events;
DROP POLICY IF EXISTS "game_events_insert" ON game_events;

-- Players can read events from their room
CREATE POLICY "game_events_select" ON game_events
FOR SELECT USING (
    room_id IN (SELECT get_user_room_ids())
);

-- Only service role can insert
CREATE POLICY "game_events_insert" ON game_events
FOR INSERT WITH CHECK (false);

-- ============================================
-- SECURE VIEWS
-- ============================================

DROP VIEW IF EXISTS active_games;
DROP VIEW IF EXISTS available_rooms;
DROP VIEW IF EXISTS room_player_counts;

-- Public room counts (only waiting rooms)
CREATE VIEW room_player_counts AS
SELECT 
    r.id AS room_id,
    r.room_code,
    r.status,
    COALESCE(r.max_players, 4) AS max_players,
    COUNT(p.id) FILTER (WHERE p.is_active = true) AS active_player_count,
    COALESCE(r.max_players, 4) - COUNT(p.id) FILTER (WHERE p.is_active = true) AS spots_available,
    CASE 
        WHEN COUNT(p.id) FILTER (WHERE p.is_active = true) >= COALESCE(r.max_players, 4) 
        THEN true ELSE false 
    END AS is_full
FROM rooms r
LEFT JOIN players p ON p.room_id = r.id
WHERE r.status = 'waiting'
GROUP BY r.id, r.room_code, r.status, r.max_players;

-- Available rooms for matchmaking
CREATE VIEW available_rooms AS
SELECT room_id, room_code, active_player_count, max_players, spots_available
FROM room_player_counts
WHERE NOT is_full;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'RLS policies created successfully' AS status;
