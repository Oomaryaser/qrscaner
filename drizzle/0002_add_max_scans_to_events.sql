-- Add max_scans column to events table
ALTER TABLE events ADD COLUMN max_scans INTEGER NOT NULL DEFAULT 5;
