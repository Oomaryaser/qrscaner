import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export type ScanResult =
  | { status: "ok"; attendedCount: number; capacityMax: number }
  | { status: "already"; attendedCount: number; capacityMax: number }
  | { status: "full"; attendedCount: number; capacityMax: number }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "event_not_found" };

export async function scanTicket(eventId: string, ticketId: string, userId: string | null): Promise<ScanResult> {
  if (!userId) return { status: "forbidden" };

  // Atomic, transaction-less scan using a single multi-CTE statement.
  // - Only increments attendance if: event belongs to user, capacity available, and ticket is not already scanned.
  // - Only marks ticket scanned if increment succeeded.
  const result = await db.execute(sql`
    with e as (
      select owner_id, attended_count, capacity_max from events where id = ${eventId}
    ),
    trow as (
      select scanned from tickets where id = ${ticketId} and event_id = ${eventId} limit 1
    ),
    t as (
      select 1 from trow where scanned = false
    ),
    inc as (
      update events
         set attended_count = events.attended_count + 1
       where id = ${eventId}
         and exists (select 1 from e where owner_id = ${userId})
         and attended_count < capacity_max
         and exists (select 1 from t)
      returning attended_count, capacity_max
    ),
    scan as (
      update tickets
         set scanned = true, scanned_at = now()
       where id = ${ticketId}
         and event_id = ${eventId}
         and scanned = false
         and exists (select 1 from inc)
      returning 1
    )
    select
      (select count(*) from e)                               as e_exists,
      (select owner_id from e)                               as owner_id,
      (select count(*) from trow)                            as t_exists,
      (select scanned from trow)                             as t_scanned,
      (select count(*) from scan)                            as scan_rows,
      coalesce((select attended_count from inc), (select attended_count from e)) as attended_count,
      coalesce((select capacity_max from inc), (select capacity_max from e))     as capacity_max
  `);

  // @ts-ignore
  const row = (result as any).rows?.[0];
  if (!row) return { status: "event_not_found" };

  const eExists = Number(row.e_exists) > 0;
  const ownerId = row.owner_id as string | null;
  const tExists = Number(row.t_exists) > 0;
  const tScanned = row.t_scanned === true || row.t_scanned === "t"; // neon may return boolean or 't'
  const scanRows = Number(row.scan_rows) > 0;
  const attendedCount = row.attended_count != null ? Number(row.attended_count) : undefined;
  const capacityMax = row.capacity_max != null ? Number(row.capacity_max) : undefined;

  if (!eExists) return { status: "event_not_found" };
  if (ownerId !== userId) return { status: "forbidden" };
  if (!tExists) return { status: "not_found" };
  if (tScanned) return { status: "already", attendedCount: attendedCount!, capacityMax: capacityMax! };
  if (scanRows) return { status: "ok", attendedCount: attendedCount!, capacityMax: capacityMax! };
  return { status: "full", attendedCount: attendedCount!, capacityMax: capacityMax! };
}
