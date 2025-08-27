import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId مطلوب" }, { status: 400 });
    const rows = await db.select({ attendedCount: events.attendedCount, capacityMax: events.capacityMax }).from(events).where(eq(events.id, eventId)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "الفعالية غير موجودة" }, { status: 404 });
    return NextResponse.json({ ok: true, ...rows[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

