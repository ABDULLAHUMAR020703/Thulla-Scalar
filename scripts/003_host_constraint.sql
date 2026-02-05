-- ============================================
-- 003_host_constraint.sql
-- Enforce Host Ownership (SAFE VERSION)
-- ============================================
-- Ensures rooms.host_id references a valid user
-- Handles existing NULL values before adding constraint
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure host_id column exists
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS host_id UUID;

-- Step 2: Check for NULL values first
-- Run this to see which rooms have NULL host_id:
SELECT id, room_code, status FROM rooms WHERE host_id IS NULL;

-- Step 3: CLEANUP - Delete rooms with NULL host_id
-- These are orphaned/invalid rooms
DELETE FROM rooms WHERE host_id IS NULL;

-- Step 4: Now safely add NOT NULL constraint
ALTER TABLE rooms 
ALTER COLUMN host_id SET NOT NULL;

-- Step 5: Add foreign key constraint to auth.users
ALTER TABLE rooms
DROP CONSTRAINT IF EXISTS rooms_host_id_fkey;

ALTER TABLE rooms
ADD CONSTRAINT rooms_host_id_fkey
FOREIGN KEY (host_id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Step 6: Add index for faster host lookups
CREATE INDEX IF NOT EXISTS idx_rooms_host_id 
ON rooms(host_id);

-- ============================================
-- VERIFICATION
-- ============================================
-- Confirm no NULL values:
-- SELECT COUNT(*) FROM rooms WHERE host_id IS NULL;
-- Should return 0

-- Check constraint exists:
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'rooms' AND constraint_type = 'FOREIGN KEY';
