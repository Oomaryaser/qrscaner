-- Add scan_count and max_scans columns to tickets table
ALTER TABLE tickets ADD COLUMN scan_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tickets ADD COLUMN max_scans INTEGER NOT NULL DEFAULT 5;
