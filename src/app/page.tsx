import { getUserIdFromCookies } from "@/lib/session";
import LoginForm from "@/components/LoginForm";
import CreateEventForm from "@/components/CreateEventForm";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export default async function Home() {
  const uid = await getUserIdFromCookies();
  if (!uid) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">تسجيل الدخول</h1>
        <LoginForm />
      </div>
    );
  }

  let myEvents: { id: string; startAtUtc: Date; createdAt: Date; capacityMax: number; attendedCount: number }[] = [];
  try {
    myEvents = await db
      .select({ id: events.id, startAtUtc: events.startAtUtc, createdAt: events.createdAt, capacityMax: events.capacityMax, attendedCount: events.attendedCount })
      .from(events)
      .where(eq(events.ownerId, uid))
      .orderBy(desc(events.createdAt));
  } catch {
    // If DB not reachable, show empty list gracefully
    myEvents = [];
  }

  const totalAttended = myEvents.reduce((sum, ev) => sum + (ev.attendedCount || 0), 0);

  return (
    <div className="space-y-10">
      <CreateEventForm />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">سجل الروابط التي أنشأتها</h2>
        <div className="text-sm text-gray-600">إجمالي الحضور عبر جميع فعالياتك: {totalAttended}</div>
        {myEvents.length === 0 ? (
          <div className="text-sm text-gray-500">لا توجد فعاليات سابقة.</div>
        ) : (
          <div className="space-y-3">
            {myEvents.map((ev) => {
              const startLocal = new Date(ev.startAtUtc.getTime() + 3 * 60 * 60 * 1000);
              const createdLocal = new Date(ev.createdAt.getTime() + 3 * 60 * 60 * 1000);
              const startStr = startLocal.toLocaleString("ar", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }) + " GMT+3";
              const createdStr = createdLocal.toLocaleString("ar", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }) + " GMT+3";
              return (
                <div key={ev.id} className="rounded border p-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm">رابط الضيوف:</div>
                    <Link href={`/e/${ev.id}`} className="text-blue-600 underline break-all">/e/{ev.id}</Link>
                    <div className="text-sm text-gray-600">موعد الفعالية: {startStr}</div>
                    <div className="text-sm text-gray-600">تاريخ الإنشاء: {createdStr}</div>
                    <div className="text-sm">الحضور: {ev.attendedCount} / {ev.capacityMax}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
