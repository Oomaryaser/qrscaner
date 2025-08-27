import AdminScanner from "@/components/AdminScanner";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/session";

export default async function ScanPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const cookieManager = await cookies();
  const uid = cookieManager.get(USER_COOKIE_NAME)?.value;
  if (!uid) return <div>غير مصرح. الرجاء تسجيل الدخول كمالك الفعالية.</div>;

  const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!rows.length) return <div>الفعالية غير موجودة</div>;
  const ev = rows[0];
  if (ev.ownerId !== uid) return <div>غير مصرح. هذه الصفحة للمشرف فقط.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">مسح رمز QR</h1>
      <div className="text-sm text-gray-500">سيظهر رمز الضيف قبل 30 دقيقة من الموعد المحدد، ويبقى ظاهرًا بعد البدء.</div>
      <AdminScanner eventId={id} initialAttended={ev.attendedCount} capacityMax={ev.capacityMax} />
    </div>
  );
}
