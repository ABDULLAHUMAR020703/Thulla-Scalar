-- ============================================
-- 008_scheduled_cleanup.sql
-- Scheduled Cleanup Job for Stale Data
-- ============================================
-- Cleans up old ended rooms and stale game events
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- CLEANUP FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_stale_data()
RETURNS JSON AS $$
DECLARE
    deleted_rooms INTEGER;
    deleted_events INTEGER;
    deleted_hands INTEGER;
    deleted_players INTEGER;
BEGIN
    -- 1. Delete stale game_events (older than 2 hours)
    DELETE FROM game_events
    WHERE created_at < NOW() - INTERVAL '2 hours';
    
    GET DIAGNOSTICS deleted_events = ROW_COUNT;
    
    -- 2. Delete hands from ended rooms (cleanup orphans)
    DELETE FROM hands
    WHERE room_id IN (
        SELECT id FROM rooms 
        WHERE status = 'ended' 
        AND created_at < NOW() - INTERVAL '24 hours'
    );
    
    GET DIAGNOSTICS deleted_hands = ROW_COUNT;
    
    -- 3. Delete players from ended rooms
    DELETE FROM players
    WHERE room_id IN (
        SELECT id FROM rooms 
        WHERE status = 'ended' 
        AND created_at < NOW() - INTERVAL '24 hours'
    );
    
    GET DIAGNOSTICS deleted_players = ROW_COUNT;
    
    -- 4. Delete ended rooms (older than 24 hours)
    DELETE FROM rooms
    WHERE status = 'ended'
    AND created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_rooms = ROW_COUNT;
    
    RETURN json_build_object(
        'deleted_rooms', deleted_rooms,
        'deleted_players', deleted_players,
        'deleted_hands', deleted_hands,
        'deleted_events', deleted_events,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENABLE PG_CRON EXTENSION
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- SCHEDULE CLEANUP JOB (Safe create)
-- ============================================

-- Remove existing job if exists (safe way)
DO $$
BEGIN
    PERFORM cron.unschedule('cleanup-stale-data');
EXCEPTION WHEN OTHERS THEN
    -- Job doesn't exist, ignore error
    NULL;
END $$;

-- Schedule new job to run every hour
SELECT cron.schedule(
    'cleanup-stale-data',
    '0 * * * *',
    'SELECT cleanup_stale_data()'
);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT jobid, jobname, schedule FROM cron.job WHERE jobname = 'cleanup-stale-data';
