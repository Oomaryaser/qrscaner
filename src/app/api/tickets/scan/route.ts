import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/session";
import { scanTicket } from "@/lib/scan";

export async function POST(req: Request) {
  try {
    const { eventId, ticketId } = await req.json();
    if (!eventId || !ticketId) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const cookieManager = await cookies();
    const userId = cookieManager.get(USER_COOKIE_NAME)?.value;
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const result = await scanTicket(eventId, ticketId, userId);

    if (result.status === "not_found") {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }
    if (result.status === "event_not_found") {
      return NextResponse.json({ error: "الضيف غير موجودة" }, { status: 404 });
    }
    if (result.status === "forbidden") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    if (result.status === "database_error") {
      return NextResponse.json({
        error: result.error,
        details: "Database connection error"
      }, { status: 503 });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Database error in tickets/scan:", e);

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
