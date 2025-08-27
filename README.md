Arabic Check-in app (Next.js App Router + Drizzle ORM + Neon Postgres)

Quick start

- Set `DATABASE_URL` in your environment (Neon connection string).
- Create tables in your database by running the SQL in `migrations/000_init.sql` (e.g., via Neon SQL editor).
- Install deps: `pnpm install`.
- Dev server: `pnpm dev` then open http://localhost:3000

Flow

- Login: enter a unique username (case-insensitive). A cookie `uid` stores your session.
- Create event: set capacity and date/time in GMT+3 (default 28-08-2025 06:30 PM). Times are stored in UTC.
- Guest link: share `/e/:eventId`.
- Guest page: before T-30m shows countdown; from T-30m and after, shows QR. After admin scans, guest sees ✔️.
- Admin scan: the QR now encodes a secure URL like `/e/:eventId/auth/:ticketId`. When the admin scans and opens it (while logged in as the owner), authorization happens automatically with no confirmation. Capacity enforced; when full, further scans are rejected and guests see “اكتمل العدد”. You can still use `/e/:eventId/scan` as an optional manual fallback.

Notes

- QR content is `ticket:<uuid>`; scan calls server to validate and increment attendance atomically.
- No password is used; only username + cookie session.
- Times display in UI as GMT+3; DB stores UTC.
