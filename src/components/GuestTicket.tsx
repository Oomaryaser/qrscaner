"use client";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type EventInfo = {
  id: string;
  name?: string;
  startAtUtc: string;
  capacityMax: number;
  attendedCount: number;
  ownerId: string;
};

export default function GuestTicket({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());

  const startAtMs = useMemo(() => (event ? new Date(event.startAtUtc).getTime() : null), [event]);
  const showQrFrom = useMemo(() => (startAtMs ? startAtMs - 30 * 60 * 1000 : null), [startAtMs]);
  const isWindowOpen = useMemo(() => (showQrFrom ? now >= showQrFrom : false), [showQrFrom, now]);
  const isFull = event ? event.attendedCount >= event.capacityMax : false;

  // Local display string in fixed timezone (GMT+3)
  const displayTime = useMemo(() => {
    if (!startAtMs) return "";
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Baghdad",
    }).format(new Date(startAtMs));
  }, [startAtMs]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tickets/ensure?eventId=${eventId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "فشل التحميل");
        setEvent(data.event);
        setTicketId(data.ticket.id);
        setScanned(Boolean(data.ticket.scanned));
      } catch (e: any) {
        setError(e.message ?? "حدث خطأ");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  useEffect(() => {
    if (!ticketId) return;
    const int = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/status?ticketId=${ticketId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.scanned) setScanned(true);
      } catch {}
    }, 2000);
    return () => clearInterval(int);
  }, [ticketId]);

  async function generateNewTicket() {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/tickets/ensure?eventId=${eventId}&new=1`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر إنشاء تذكرة جديدة");
      setEvent(data.event);
      setTicketId(data.ticket.id);
      setScanned(Boolean(data.ticket.scanned));
    } catch (e: any) {
      setError(e.message ?? "تعذر إنشاء تذكرة جديدة");
    } finally {
      setRefreshing(false);
    }
  }

  // Poll event stats to hide QR when full
  useEffect(() => {
    if (!event) return;
    const int = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/stats?eventId=${event.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setEvent((prev) => (prev ? { ...prev, attendedCount: data.attendedCount, capacityMax: data.capacityMax } : prev));
      } catch {}
    }, 5000);
    return () => clearInterval(int);
  }, [event?.id]);

  if (loading) return <div>...جاري التحميل</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!event || !ticketId) return <div>حدث خطأ غير متوقع</div>;

  const qrUrl = (() => {
    if (!ticketId) return "";
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    return `${origin}/e/${eventId}/auth/${ticketId}`;
  })();

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">موعد الضيف: {displayTime}</div>

      {event?.name && (
        <div className="text-lg font-medium text-center">{event.name}</div>
      )}

      {isFull && (
        <div className="p-3 border rounded text-center">اكتمل العدد</div>
      )}

      {!isFull && !scanned && !isWindowOpen && (
        <div className="p-3 border rounded text-center">سيظهر رمز الـ QR قبل 30 دقيقة من الموعد</div>
      )}

      {!isFull && !scanned && isWindowOpen && (
        <div className="flex flex-col items-center gap-3">
          <QRCodeSVG value={qrUrl} size={224} />
          <div className="text-sm text-gray-500">يرجى إظهار هذا الرمز للمشرف ليقوم بمسحه وفتحه</div>
        </div>
      )}

      {scanned && (
        <div className="p-3 border rounded text-center text-green-600 text-xl space-y-3">
          <div>✔️ تم التحقق</div>
          <button
            onClick={generateNewTicket}
            disabled={refreshing}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {refreshing ? "...جارٍ الإنشاء" : "اضافة ضيف اخر"}
          </button>
        </div>
      )}
    </div>
  );
}
