-- ============================================
-- 002_player_cleanup_trigger.sql
-- Auto-cleanup Empty Rooms
-- ============================================
-- When all players leave (is_active = false), room ends automatically
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create function to check and cleanup empty rooms
CREATE OR REPLACE FUNCTION cleanup_empty_room()
RETURNS TRIGGER AS $$
DECLARE
    active_count INTEGER;
BEGIN
    -- Count active players in the affected room
    SELECT COUNT(*) INTO active_count
    FROM players
    WHERE room_id = COALESCE(NEW.room_id, OLD.room_id)
      AND is_active = true;
    
    -- If no active players remain, end the room
    IF active_count = 0 THEN
        UPDATE rooms
        SET status = 'ended'
        WHERE id = COALESCE(NEW.room_id, OLD.room_id)
          AND status != 'ended';
        
        RAISE NOTICE 'Room % ended: no active players', COALESCE(NEW.room_id, OLD.room_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on players table
DROP TRIGGER IF EXISTS trigger_player_cleanup ON players;

CREATE TRIGGER trigger_player_cleanup
AFTER UPDATE OF is_active OR DELETE
ON players
FOR EACH ROW
EXECUTE FUNCTION cleanup_empty_room();

-- ============================================
-- ALTERNATIVE: Trigger on INSERT/UPDATE/DELETE
-- ============================================
-- Uncomment below if you want to check on all changes

-- DROP TRIGGER IF EXISTS trigger_player_cleanup_all ON players;
-- 
-- CREATE TRIGGER trigger_player_cleanup_all
-- AFTER INSERT OR UPDATE OR DELETE
-- ON players
-- FOR EACH ROW
-- EXECUTE FUNCTION cleanup_empty_room();

-- ============================================
-- VERIFICATION
-- ============================================
-- Test by deactivating all players in a room:
-- UPDATE players SET is_active = false WHERE room_id = 'your-room-id';
-- Then check: SELECT status FROM rooms WHERE id = 'your-room-id';
-- Should be 'ended'
