# Arabic Check-in App with Multi-Scan QR Codes

Next.js App Router + Drizzle ORM + Neon Postgres

## ✨ New Features - Multi-Scan QR System

### 🔄 Multiple Scan Support
- **QR codes can now be scanned multiple times** (up to 5 times by default)
- **Each scan reduces available attendance slots**
- **Real-time counter display** on QR codes
- **Smart validation** prevents over-scanning

### 📊 Enhanced UI Features
- **Scan counter badge** on QR codes showing current/max scans
- **Progress tracking** for each ticket**
- **Warning messages** when approaching scan limits
- **Detailed scan history** in admin interface

### 🛡️ Improved Security & Validation
- **Atomic scan operations** with database transactions
- **Real-time status updates** for guests and admins
- **Graceful error handling** for max scan scenarios
- **Automatic cleanup** of expired sessions

## Database Schema Updates

The following column has been added to the `tickets` table:
- `scan_count` (INTEGER, DEFAULT 0) - Tracks number of times scanned

The `max_scans` column has been removed to allow unlimited scans.

Run the migration: `npx drizzle-kit migrate`

## Quick Start

- Set `DATABASE_URL` in your environment (Neon connection string).
- Create tables in your database by running the SQL in `migrations/000_init.sql` (e.g., via Neon SQL editor).
- Install deps: `pnpm install`.
- Dev server: `pnpm dev` then open http://localhost:3000

## Flow

- Login: enter a unique username (case-insensitive). A cookie `uid` stores your session.
- Create event: set capacity and date/time in GMT+3 (default 28-08-2025 06:30 PM). Times are stored in UTC.
- Guest link: share `/e/:eventId`.
- Guest page: before T-30m shows countdown; from T-30m and after, shows QR with scan counter. After admin scans, guest sees success message with scan count.
- Admin scan: the QR now encodes a secure URL like `/e/:eventId/auth/:ticketId`. When the admin scans and opens it (while logged in as the owner), authorization happens automatically with no confirmation. Capacity enforced; when full, further scans are rejected and guests see "اكتمل العدد". You can still use `/e/:eventId/scan` as an optional manual fallback.

## Multi-Scan Behavior

- **First scan**: Normal attendance increment + success message
- **Subsequent scans**: Attendance increment continues + updated counter
- **Max scans reached**: Warning message, no more attendance increment
- **Real-time updates**: Both guest and admin see live scan counts

## Notes

- QR content is `ticket:<uuid>`; scan calls server to validate and increment attendance atomically.
- No password is used; only username + cookie session.
- Times display in UI as GMT+3; DB stores UTC.
- Scan counter resets are not supported (by design for security)

## Database Connection Issues

If you encounter database connection errors (ConnectTimeoutError), follow these steps:

### 1. Check Database Status
Visit `http://localhost:3000/api/health` to check the database connection status.

### 2. Common Solutions

#### Network Issues
- **Check your internet connection**
- **VPN/Security software**: Disable VPN or add Neon domains to whitelist
- **Firewall**: Ensure ports 443 (HTTPS) are open

#### Neon Database Issues
- **Verify DATABASE_URL**: Ensure the connection string in `.env` is correct
- **Check Neon dashboard**: Verify your database is active and not paused
- **Connection limits**: Check if you've exceeded Neon connection limits
- **Region settings**: Ensure your Neon database region matches your location

#### Environment Configuration
- **Restart development server**: `pnpm dev`
- **Check .env file**: Ensure DATABASE_URL is properly set
- **Environment variables**: Make sure .env is in the project root

### 3. Troubleshooting Commands

```bash
# Check if Neon is reachable
curl -I https://ep-floral-mouse-a2o4236z-pooler.eu-central-1.aws.neon.tech

# Test database connection (requires psql)
psql "postgresql://neondb_owner:npg_ViYIOU7S1ZhD@ep-floral-mouse-a2o4236z-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Check environment variables
echo $DATABASE_URL
```

### 4. Alternative Solutions

If connection issues persist:

1. **Create a new Neon database** in a different region
2. **Use a local PostgreSQL instance** for development
3. **Check Neon status page** for service outages
4. **Contact Neon support** if issues persist

### 5. Error Codes

- `UND_ERR_CONNECT_TIMEOUT`: Connection timeout - check network/firewall
- `ENOTFOUND`: DNS resolution failed - check internet connection
- `ECONNREFUSED`: Connection refused - check database status
- `SSL_ERROR`: SSL/TLS issues - verify connection string

The app includes enhanced error handling and will display connection status in the UI.</content>
<parameter name="filePath">C:\Users\AL-WAFI\Downloads\Telegram Desktop\untitled17\README_NEW.md
