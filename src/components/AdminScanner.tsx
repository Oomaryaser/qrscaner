"use client";
import { useEffect, useRef, useState } from "react";

type Props = { eventId: string; initialAttended: number; capacityMax: number };

export default function AdminScanner({ eventId, initialAttended, capacityMax }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [supported, setSupported] = useState<boolean>(false);
  const [streamErr, setStreamErr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [attended, setAttended] = useState<number>(initialAttended);
  const [manual, setManual] = useState<string>("");
  const lastTicketRef = useRef<string | null>(null);

  useEffect(() => {
    // Check support
    // @ts-ignore
    const has = typeof window !== "undefined" && window.BarcodeDetector;
    setSupported(Boolean(has));
  }, []);

  useEffect(() => {
    let stop = false;
    let detector: any;
    let raf = 0;
    let interval: any;

    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        // @ts-ignore
        detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const scan = async () => {
          if (stop || !videoRef.current) return;
          try {
            const v = videoRef.current;
            const canvas = canvasRef.current!;
            const w = v.videoWidth;
            const h = v.videoHeight;
            if (w && h) {
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(v, 0, 0, w, h);
                // @ts-ignore
                const codes = await detector.detect(canvas);
                if (codes && codes.length) {
                  const raw = String(codes[0].rawValue || codes[0].rawData || "");
                  handleDetected(raw);
                }
              }
            }
          } catch (e) {
            // ignore frame errors
          }
        };
        interval = setInterval(scan, 600);
      } catch (e: any) {
        setStreamErr("تعذر فتح الكاميرا. يمكنك الإدخال اليدوي.");
      }
    }

    if (supported) setup();
    return () => {
      stop = true;
      if (interval) clearInterval(interval);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
      cancelAnimationFrame(raf);
    };
  }, [supported]);

  function parseTicket(text: string): string | null {
    const s = text.trim();
    // Pattern 1: ticket:<uuid>
    let m = /^ticket:([0-9a-fA-F-]{36})$/.exec(s);
    if (m) return m[1];
    // Pattern 2: URL .../e/<eventId>/auth/<ticketId>
    try {
      const url = new URL(s);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "e");
      if (idx !== -1 && parts[idx + 2] === "auth") {
        const tid = parts[idx + 3];
        if (/^[0-9a-fA-F-]{36}$/.test(tid)) return tid;
      }
    } catch {}
    // Pattern 3: raw UUID
    if (/^[0-9a-fA-F-]{36}$/.test(s)) return s;
    return null;
  }

  async function sendScan(id: string) {
    try {
      const res = await fetch("/api/tickets/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ticketId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل المسح");
      if (data.status === "ok") {
        setAttended(data.attendedCount);
        setMessage("✔️ تم تسجيل الحضور");
      } else if (data.status === "already") {
        setMessage("تم تسجيل هذه التذكرة مسبقًا");
      } else if (data.status === "full") {
        setAttended(data.attendedCount ?? attended);
        setMessage("اكتمل العدد — لا يمكن قبول المزيد");
      } else {
        setMessage("لم يتم التعرف على التذكرة");
      }
    } catch (e: any) {
      setMessage(e.message ?? "خطأ أثناء المسح");
    }
  }

  function handleDetected(text: string) {
    const id = parseTicket(text);
    if (!id) return;
    if (lastTicketRef.current === id) return;
    lastTicketRef.current = id;
    void sendScan(id);
  }

  async function manualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = parseTicket(manual) || manual.trim();
    if (!id) return;
    await sendScan(id);
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">الحضور: {attended} / {capacityMax}</div>
      <div className="rounded border p-3 space-y-3">
        <div className="text-sm">ماسح QR</div>
        {supported ? (
          <div className="space-y-2">
            <video ref={videoRef} className="w-full rounded" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="text-sm text-gray-500">جهازك لا يدعم ماسح QR تلقائيًا. استخدم الإدخال اليدوي أدناه.</div>
        )}
        {streamErr && <div className="text-xs text-red-600">{streamErr}</div>}
        <form onSubmit={manualSubmit} className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 bg-transparent"
            placeholder="ألصق رابط التفويض أو المعرّف"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <button className="px-3 py-2 rounded bg-blue-600 text-white">تحقق</button>
        </form>
      </div>
      {message && <div className="p-2 rounded bg-gray-100 dark:bg-gray-900">{message}</div>}
    </div>
  );
}
