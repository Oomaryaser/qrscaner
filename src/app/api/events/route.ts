import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/session";
import { ADMIN_USER_ID } from "@/lib/admin";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

function parseGmt3ToUtc(dateStr: string, timeStr: string): Date | null {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateStr || "");
  const t = /^([0-9]{2}):([0-9]{2})$/.exec(timeStr || "");
  if (!m || !t) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hh = Number(t[1]);
  const mm = Number(t[2]);
  const utcMs = Date.UTC(y, mo - 1, d, hh - 3, mm, 0, 0);
  return new Date(utcMs);
}

export async function POST(req: Request) {
  try {
    const cookieManager = await cookies();
    const userId = cookieManager.get(USER_COOKIE_NAME)?.value;
    if (!userId) {
      return NextResponse.json({ error: "مطلوب تسجيل الدخول" }, { status: 401 });
    }
    if (userId !== ADMIN_USER_ID) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { date, time, capacity, name, phone } = await req.json();
    const cap = Number(capacity);
    const trimmedName = (name ?? "").toString().trim();
    const trimmedPhone = (phone ?? "").toString().trim();

    if (!date || !time || !Number.isFinite(cap) || cap <= 0 || !trimmedName) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    // Basic phone validation (optional) - allow +, digits, spaces, dashes, parentheses
    if (trimmedPhone && !/^\+?[0-9\s\-()]{6,20}$/.test(trimmedPhone)) {
      return NextResponse.json({ error: "رقم هاتف غير صالح" }, { status: 400 });
    }

    const startAtUtc = parseGmt3ToUtc(date, time);
    if (!startAtUtc) {
      return NextResponse.json({ error: "تاريخ/وقت غير صالح" }, { status: 400 });
    }

    const id = randomUUID();
    await db.insert(events).values({ id, ownerId: userId, capacityMax: cap, startAtUtc, name: trimmedName, phone: trimmedPhone || null });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
