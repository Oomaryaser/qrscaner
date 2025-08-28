import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { events, tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "معرف مجموعة الضيوف مطلوب" }, { status: 400 });

    // If new=1 or new=true is provided, force generating a new ticket and updating the cookie
    const forceNew = (() => {
      const v = (searchParams.get("new") || "").toLowerCase();
      return v === "1" || v === "true" || v === "yes";
    })();

    let ev: any[] = [];
    try {
      ev = await db.select({
        id: events.id,
        name: (events as any).name,
        startAtUtc: events.startAtUtc,
        capacityMax: events.capacityMax,
        attendedCount: events.attendedCount,
        ownerId: events.ownerId
      }).from(events).where(eq(events.id, eventId)).limit(1);
    } catch {
      // Fallback for databases without the name column yet
      ev = await db.select({
        id: events.id,
        startAtUtc: events.startAtUtc,
        capacityMax: events.capacityMax,
        attendedCount: events.attendedCount,
        ownerId: events.ownerId
      }).from(events).where(eq(events.id, eventId)).limit(1);
    }
    if (!ev.length) return NextResponse.json({ error: "مجموعة الضيوف غير موجودة" }, { status: 404 });
    const event = ev[0];

    const cookieName = `ticket_${eventId}`;
    const cookieManager = await cookies();
    const cid = cookieManager.get(cookieName)?.value;

    let tId = cid || null;
    let tRow: { id: string; scanned: boolean; scanCount?: number } | null = null;
    if (tId) {
      const t = await db
        .select({
          id: tickets.id,
          scanned: tickets.scanned,
          scanCount: tickets.scanCount
        })
        .from(tickets)
        .where(eq(tickets.id, tId))
        .limit(1);
      if (t.length) tRow = t[0];
      else tId = null;
    }

    let setCookie = false;
    if (forceNew) {
      tId = randomUUID();
      await db.insert(tickets).values({ id: tId, eventId: eventId });
      setCookie = true;
      tRow = { id: tId, scanned: false, scanCount: 0 };
    } else if (!tId) {
      tId = randomUUID();
      await db.insert(tickets).values({ id: tId, eventId: eventId });
      setCookie = true;
      tRow = { id: tId, scanned: false, scanCount: 0 };
    }

    const res = NextResponse.json({
      ok: true,
      event: {
        id: event.id,
        name: (event as any).name ?? "",
        startAtUtc: event.startAtUtc,
        capacityMax: event.capacityMax,
        attendedCount: event.attendedCount,
        ownerId: event.ownerId,
        ownerName: (event as any).ownerName, // optional
      },
      ticket: tRow,
    });
    if (setCookie) {
      res.cookies.set({
        name: cookieName,
        value: tId!,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
