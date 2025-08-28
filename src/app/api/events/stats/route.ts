import { NextResponse } from "next/server";
import { db, checkDatabaseConnection } from "@/db/client";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json({
        error: "خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.",
        details: "Database connection failed"
      }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "eventId مطلوب" }, { status: 400 });
    }

    const rows = await db.select({
      attendedCount: events.attendedCount,
      capacityMax: events.capacityMax
    }).from(events).where(eq(events.id, eventId)).limit(1);

    if (!rows.length) {
      return NextResponse.json({ error: "الضيف غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...rows[0] });
  } catch (e: any) {
    console.error("Database error in events/stats:", e);

    // Check if it's a connection error
    if (e.message?.includes('fetch failed') || e.message?.includes('Connect Timeout') || e.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json({
        error: "خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً.",
        details: "Connection timeout or network error"
      }, { status: 503 });
    }

    return NextResponse.json({
      error: "خطأ في الخادم",
      details: process.env.NODE_ENV === 'development' ? e.message : undefined
    }, { status: 500 });
  }
}

