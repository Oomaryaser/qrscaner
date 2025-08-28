import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { USER_COOKIE_NAME, normalizeUsername } from "@/lib/session";
import { ADMIN_USER_ID, ADMIN_USERNAME, ADMIN_PASSCODE } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const inputRaw = (body?.passcode ?? body?.username) as string | undefined;
    const input = typeof inputRaw === "string" ? inputRaw.trim() : "";

    if (!input) {
      return NextResponse.json({ error: "بيانات تسجيل غير صحيحة" }, { status: 401 });
    }

    if (input === ADMIN_PASSCODE) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, ADMIN_USER_ID))
        .limit(1);

      if (!existing.length) {
        await db.insert(users).values({ id: ADMIN_USER_ID, username: ADMIN_USERNAME, usernameNorm: ADMIN_USER_ID });
      }

      const res = NextResponse.json({ ok: true, userId: ADMIN_USER_ID, role: "owner", username: ADMIN_USERNAME });
      res.cookies.set({
        name: USER_COOKIE_NAME,
        value: ADMIN_USER_ID,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
      });
      return res;
    }

    // Otherwise treat the input as an admin username: must already exist
    const { norm } = normalizeUsername(input);
    const u = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.usernameNorm, norm))
      .limit(1);

    if (!u.length) {
      return NextResponse.json({ error: "بيانات تسجيل غير صحيحة" }, { status: 401 });
    }

    const adminUserId = u[0].id as string;
    const res = NextResponse.json({ ok: true, userId: adminUserId, role: "admin", username: u[0].username as string });
    res.cookies.set({
      name: USER_COOKIE_NAME,
      value: adminUserId,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
