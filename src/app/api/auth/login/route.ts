import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME, normalizeUsername } from "@/lib/session";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "اسم المستخدم مطلوب" }, { status: 400 });
    }
    const { norm, display } = normalizeUsername(username);
    if (!norm) {
      return NextResponse.json({ error: "اسم غير صالح" }, { status: 400 });
    }

    const found = await db.select().from(users).where(eq(users.usernameNorm, norm)).limit(1);
    let uid: string;
    if (found.length) {
      uid = found[0].id;
    } else {
      uid = randomUUID();
      await db.insert(users).values({ id: uid, username: display, usernameNorm: norm });
    }

    const res = NextResponse.json({ ok: true, userId: uid });
    res.cookies.set({
      name: USER_COOKIE_NAME,
      value: uid,
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
