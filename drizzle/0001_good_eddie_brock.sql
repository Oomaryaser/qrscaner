ALTER TABLE "tickets" ADD COLUMN "scan_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "max_scans" integer DEFAULT 5 NOT NULL;