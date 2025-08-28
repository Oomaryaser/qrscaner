import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/session";

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: USER_COOKIE_NAME,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
