-- Drop max_scans columns from events and tickets tables
ALTER TABLE events DROP COLUMN IF EXISTS max_scans;
ALTER TABLE tickets DROP COLUMN IF EXISTS max_scans;
