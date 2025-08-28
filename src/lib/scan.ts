import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export type ScanResult =
  | { status: "ok"; attendedCount: number; capacityMax: number; scanCount: number }
  | { status: "already"; attendedCount: number; capacityMax: number; scanCount: number }
  | { status: "full"; attendedCount: number; capacityMax: number; scanCount: number }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "event_not_found" }
  | { status: "database_error"; error: string };

export async function scanTicket(eventId: string, ticketId: string, userId: string | null): Promise<ScanResult> {
  if (!userId) return { status: "forbidden" };

  try {
    // First try with new columns
    try {
      const result = await db.execute(sql`
        with e as (
          select owner_id, attended_count, capacity_max from events where id = ${eventId}
        ),
        trow as (
          select scanned, scan_count from tickets where id = ${ticketId} and event_id = ${eventId} limit 1
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
             set scan_count = scan_count + 1,
                 scanned = true,
                 scanned_at = now()
           where id = ${ticketId}
             and event_id = ${eventId}
             and scanned = false
             and exists (select 1 from inc)
          returning scan_count
        )
        select
          (select count(*) from e)                               as e_exists,
          (select owner_id from e)                               as owner_id,
          (select count(*) from trow)                            as t_exists,
          (select scanned from trow)                             as t_scanned,
          (select scan_count from trow)                          as t_scan_count,
          (select count(*) from scan)                            as scan_rows,
          coalesce((select attended_count from inc), (select attended_count from e)) as attended_count,
          coalesce((select capacity_max from inc), (select capacity_max from e))     as capacity_max,
          coalesce((select scan_count from scan), (select scan_count from trow))     as current_scan_count
      `);

      // @ts-ignore
      const row = (result as any).rows?.[0];
      if (!row) return { status: "event_not_found" };

      const eExists = Number(row.e_exists) > 0;
      const ownerId = row.owner_id as string | null;
      const tExists = Number(row.t_exists) > 0;
      const tScanned = row.t_scanned === true || row.t_scanned === "t";
      const tScanCount = row.t_scan_count != null ? Number(row.t_scan_count) : 0;
      const scanRows = Number(row.scan_rows) > 0;
      const attendedCount = row.attended_count != null ? Number(row.attended_count) : 0;
      const capacityMax = row.capacity_max != null ? Number(row.capacity_max) : 0;
      const currentScanCount = row.current_scan_count != null ? Number(row.current_scan_count) : tScanCount;

      if (!eExists) return { status: "event_not_found" };
      if (ownerId !== userId) return { status: "forbidden" };
      if (!tExists) return { status: "not_found" };
      if (tScanned) return { status: "already", attendedCount, capacityMax, scanCount: currentScanCount };
      if (scanRows) return { status: "ok", attendedCount, capacityMax, scanCount: currentScanCount };
      return { status: "full", attendedCount, capacityMax, scanCount: currentScanCount };
    } catch (newColumnsError) {
      // Fallback to old logic if new columns don't exist
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
      const tScanned = row.t_scanned === true || row.t_scanned === "t";
      const scanRows = Number(row.scan_rows) > 0;
      const attendedCount = row.attended_count != null ? Number(row.attended_count) : undefined;
      const capacityMax = row.capacity_max != null ? Number(row.capacity_max) : undefined;

      if (!eExists) return { status: "event_not_found" };
      if (ownerId !== userId) return { status: "forbidden" };
      if (!tExists) return { status: "not_found" };
      if (tScanned) return { status: "already", attendedCount: attendedCount!, capacityMax: capacityMax!, scanCount: 0 };
      if (scanRows) return { status: "ok", attendedCount: attendedCount!, capacityMax: capacityMax!, scanCount: 0 };
      return { status: "full", attendedCount: attendedCount!, capacityMax: capacityMax!, scanCount: 0 };
    }
  } catch (e: any) {
    console.error("Database error in scanTicket:", e);

    // Check if it's a connection error
    if (e.message?.includes('fetch failed') || e.message?.includes('Connect Timeout') || e.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return {
        status: "database_error",
        error: "خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً."
      };
    }

    return {
      status: "database_error",
      error: "خطأ في قاعدة البيانات: " + (process.env.NODE_ENV === 'development' ? e.message : "خطأ غير معروف")
    };
  }
}