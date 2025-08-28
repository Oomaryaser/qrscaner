import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/session";
import { ADMIN_USER_ID, ADMIN_USERNAME, verifyAdminPasscode } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    const passcode = typeof username === "string" ? username.trim() : "";

    if (!verifyAdminPasscode(passcode)) {
      return NextResponse.json({ error: "رمز غير صالح" }, { status: 401 });
    }

    const existing = await db.select().from(users).where(eq(users.id, ADMIN_USER_ID)).limit(1);
    if (!existing.length) {
      await db.insert(users).values({ id: ADMIN_USER_ID, username: ADMIN_USERNAME, usernameNorm: ADMIN_USER_ID });
    }

    const res = NextResponse.json({ ok: true, userId: ADMIN_USER_ID });
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
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
