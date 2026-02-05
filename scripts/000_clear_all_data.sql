-- ============================================
-- 000_clear_all_data.sql
-- Clear All Database Data (DEVELOPMENT ONLY)
-- ============================================
-- ⚠️ WARNING: This deletes ALL data from game tables
-- Only run this in development/testing environments!
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Disable foreign key checks temporarily
-- (Supabase handles this via CASCADE, but being explicit)

-- Step 2: Clear tables in dependency order (child tables first)

-- Clear hands (cards in player hands)
TRUNCATE TABLE hands CASCADE;

-- Clear players
TRUNCATE TABLE players CASCADE;

-- Clear rooms
TRUNCATE TABLE rooms CASCADE;

-- ============================================
-- ALTERNATIVE: Delete with foreign key respect
-- ============================================
-- If TRUNCATE fails, use DELETE instead:

-- DELETE FROM hands;
-- DELETE FROM players;
-- DELETE FROM rooms;

-- ============================================
-- RESET ID SEQUENCES (Optional)
-- ============================================
-- If using serial/sequence IDs, reset them:

-- ALTER SEQUENCE rooms_id_seq RESTART WITH 1;
-- ALTER SEQUENCE players_id_seq RESTART WITH 1;
-- ALTER SEQUENCE hands_id_seq RESTART WITH 1;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check all tables are empty:

SELECT 'rooms' AS table_name, COUNT(*) AS row_count FROM rooms
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'hands', COUNT(*) FROM hands;

-- All counts should be 0
