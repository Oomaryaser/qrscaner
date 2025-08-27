import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");
    if (!ticketId) return NextResponse.json({ error: "ticketId مطلوب" }, { status: 400 });
    const t = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
    if (!t.length) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    return NextResponse.json({ ok: true, scanned: t[0].scanned });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

