import GuestTicket from "@/components/GuestTicket";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/session";

export default async function EventGuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let owner = "";
  try {
    const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!rows.length) return <div>الرابط غير صحيح</div>;
    owner = rows[0].ownerId;
  } catch {
  }
  const cookieManager = await cookies();
  const uid = cookieManager.get(USER_COOKIE_NAME)?.value;
  const isOwner = uid && owner === uid;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">تذكرة الضيف</h1>
      <GuestTicket eventId={id} />
      {isOwner ? (
        <div className="pt-2">
        </div>
      ) : null}
    </div>
  );
}
