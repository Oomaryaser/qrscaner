import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/session";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ADMIN_USER_ID, ADMIN_USERNAME } from "@/lib/admin";

export async function getCurrentUser() {
  const c = await cookies();
  const uid = c.get(USER_COOKIE_NAME)?.value || null;
  if (!uid) return null;
  if (uid === ADMIN_USER_ID) {
    return { id: uid, username: ADMIN_USERNAME, role: "owner" as const };
  }
  try {
    const u = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    if (!u.length) return { id: uid, username: "مشرف", role: "admin" as const };
    return { id: uid, username: (u[0] as any).username as string, role: "admin" as const };
  } catch {
    return { id: uid, username: "مشرف", role: "admin" as const };
  }
}
