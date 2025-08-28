import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/session";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieManager = await cookies();
    const userId = cookieManager.get(USER_COOKIE_NAME)?.value;
    if (!userId) {
      return NextResponse.json({ error: "مطلوب تسجيل الدخول" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let eventId: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      eventId = body?.eventId ?? null;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      eventId = (form.get("eventId") as string) ?? null;
    } else {
      // Also support query param fallback
      const { searchParams } = new URL(req.url);
      eventId = searchParams.get("eventId");
    }

    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json({ error: "eventId مطلوب" }, { status: 400 });
    }

    // Perform reset in a single SQL statement with ownership check
    const result = await db.execute(sql`
      with e as (
        select id, owner_id from events where id = ${eventId} limit 1
      ),
      -- reset tickets for the event
      reset_t as (
        update tickets
           set scanned = false,
               scanned_at = null,
               scan_count = 0
         where event_id = ${eventId}
           and exists (select 1 from e where owner_id = ${userId})
        returning 1
      ),
      -- reset attended count on the event
      reset_e as (
        update events
           set attended_count = 0
         where id = ${eventId}
           and exists (select 1 from e where owner_id = ${userId})
        returning attended_count
      )
      select
        (select count(*) from e) as e_exists,
        (select owner_id from e) as owner_id,
        (select count(*) from reset_e) as events_updated,
        (select count(*) from reset_t) as tickets_updated
    `);

    // @ts-ignore - neon returns rows array
    const row = (result as any).rows?.[0];
    if (!row) {
      return NextResponse.json({ error: "الضيف غير موجودة" }, { status: 404 });
    }

    const eExists = Number(row.e_exists) > 0;
    const ownerId = row.owner_id as string | null;
    const eventsUpdated = Number(row.events_updated) || 0;

    if (!eExists) {
      return NextResponse.json({ error: "الضيف غير موجودة" }, { status: 404 });
    }
    if (ownerId !== userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    if (eventsUpdated === 0) {
      return NextResponse.json({ error: "تعذر إعادة التعيين" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Database error in events/reset:", e);

    if (e?.message?.includes('fetch failed') || e?.message?.includes('Connect Timeout') || e?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json({ error: "خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً." }, { status: 503 });
    }

    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
