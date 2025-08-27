import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/session";
import { scanTicket } from "@/lib/scan";
import Link from "next/link";

export default async function AuthorizeTicketPage({ params }: { params: { id: string; ticketId: string } }) {
  const { id, ticketId } = params;
  const cookieManager = await cookies();
  const userId = cookieManager.get(USER_COOKIE_NAME)?.value ?? null;

  const result = await scanTicket(id, ticketId, userId);

  let title = "";
  let detail: string | null = null;
  if (result.status === "ok") {
    title = "✔️ تم تسجيل الحضور";
    detail = `الحضور: ${result.attendedCount} / ${result.capacityMax}`;
  } else if (result.status === "already") {
    title = "تم تسجيل هذه التذكرة مسبقًا";
    detail = `الحضور: ${result.attendedCount} / ${result.capacityMax}`;
  } else if (result.status === "full") {
    title = "اكتمل العدد — لا يمكن قبول المزيد";
    detail = `الحضور: ${result.attendedCount} / ${result.capacityMax}`;
  } else if (result.status === "forbidden") {
    title = "غير مصرح";
    detail = "يجب أن تكون مسجلاً كمالك الفعالية.";
  } else if (result.status === "event_not_found") {
    title = "الفعالية غير موجودة";
  } else {
    title = "التذكرة غير موجودة";
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      {detail && <div className="text-sm text-gray-500">{detail}</div>}
    </div>
  );
}

