import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/session";
import { scanTicket } from "@/lib/scan";

export async function POST(req: Request) {
  try {
    const { eventId, ticketId } = await req.json();
    if (!eventId || !ticketId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    const cookieManager = await cookies();
    const userId = cookieManager.get(USER_COOKIE_NAME)?.value;
    if (!userId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const result = await scanTicket(eventId, ticketId, userId);
    if (result.status === "not_found") return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    if (result.status === "event_not_found") return NextResponse.json({ error: "الفعالية غير موجودة" }, { status: 404 });
    if (result.status === "forbidden") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
