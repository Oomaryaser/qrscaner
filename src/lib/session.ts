import { cookies } from "next/headers";

const USER_COOKIE = "uid";

export async function getUserIdFromCookies(): Promise<string | null> {
  try {
    const c = await cookies();
    const v = c.get(USER_COOKIE)?.value;
    return v ?? null;
  } catch {
    return null;
  }
}

export const USER_COOKIE_NAME = USER_COOKIE;

export function normalizeUsername(name: string): { norm: string; display: string } {
  const display = name.trim();
  const norm = display.toLowerCase();
  return { norm, display };
}
