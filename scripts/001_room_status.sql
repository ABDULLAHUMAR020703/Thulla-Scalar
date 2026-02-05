-- ============================================
-- 001_room_status.sql
-- Add Room Status Constraint
-- ============================================
-- Ensures rooms.status can only be 'waiting', 'playing', or 'ended'
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create enum type for room status (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
        CREATE TYPE room_status AS ENUM ('waiting', 'playing', 'ended');
    END IF;
END $$;

-- Step 2: Add status column if not exists, or alter existing
-- Option A: If status column doesn't exist
-- ALTER TABLE rooms ADD COLUMN status room_status DEFAULT 'waiting';

-- Option B: If status exists as text, convert to enum
-- First, update any invalid values
UPDATE rooms 
SET status = 'ended' 
WHERE status NOT IN ('waiting', 'playing', 'ended');

-- Add check constraint for text-based status (alternative to enum)
ALTER TABLE rooms 
DROP CONSTRAINT IF EXISTS rooms_status_check;

ALTER TABLE rooms 
ADD CONSTRAINT rooms_status_check 
CHECK (status IN ('waiting', 'playing', 'ended'));

-- Set default value
ALTER TABLE rooms 
ALTER COLUMN status SET DEFAULT 'waiting';

-- Add index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_rooms_status 
ON rooms(status);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the constraint:
-- INSERT INTO rooms (status) VALUES ('invalid'); -- Should fail
-- INSERT INTO rooms (status) VALUES ('waiting'); -- Should succeed
