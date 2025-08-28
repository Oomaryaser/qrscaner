import { NextResponse } from "next/server";
import { db, checkDatabaseConnection } from "@/db/client";
import { tickets } from "@/db/schema";
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
    const ticketId = searchParams.get("ticketId");
    if (!ticketId) {
      return NextResponse.json({ error: "ticketId مطلوب" }, { status: 400 });
    }

    try {
      const t = await db.select({
        scanned: tickets.scanned,
        scanCount: tickets.scanCount
      }).from(tickets).where(eq(tickets.id, ticketId)).limit(1);
      if (!t.length) {
        return NextResponse.json({ error: "غير موجود" }, { status: 404 });
      }

      return NextResponse.json({
        ok: true,
        scanned: t[0].scanned,
        scanCount: t[0].scanCount || 0
      });
    } catch (error) {
      // If columns don't exist, try without them
      const t = await db.select({
        scanned: tickets.scanned
      }).from(tickets).where(eq(tickets.id, ticketId)).limit(1);
      if (!t.length) {
        return NextResponse.json({ error: "غير موجود" }, { status: 404 });
      }

      return NextResponse.json({
        ok: true,
        scanned: t[0].scanned,
        scanCount: 0
      });
    }
  } catch (e: any) {
    console.error("Database error in tickets/status:", e);

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

