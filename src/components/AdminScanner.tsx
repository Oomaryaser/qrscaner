"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';

type Props = { eventId: string; initialAttended: number; capacityMax: number };

export default function AdminScanner({ eventId, initialAttended, capacityMax }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [supported, setSupported] = useState<boolean>(false);
  const [streamErr, setStreamErr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [attended, setAttended] = useState<number>(initialAttended);
  const [manual, setManual] = useState<string>("");
  const [scanLoading, setScanLoading] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    // @ts-ignore
    const has = typeof window !== "undefined" && window.BarcodeDetector;
    setSupported(Boolean(has));
  }, []);

  useEffect(() => {
    let stop = false;
    let detector: any;
    let interval: any;

    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });
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
          } catch (e) {}
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
    };
  }, [supported]);

  function parseTicket(text: string): string | null {
    const s = text.trim();
    let m = /^ticket:([0-9a-fA-F-]{36})$/.exec(s);
    if (m) return m[1];
    try {
      const url = new URL(s);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "e");
      if (idx !== -1 && parts[idx + 2] === "auth") {
        const tid = parts[idx + 3];
        if (/^[0-9a-fA-F-]{36}$/.test(tid)) return tid;
      }
    } catch {}
    if (/^[0-9a-fA-F-]{36}$/.test(s)) return s;
    return null;
  }

  async function sendScan(id: string) {
    setScanLoading(true);
    setMessage(null);

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
        setMessage(`✨ تم التحقق بنجاح!\nتم تسجيل حضورك في الضيف\n(تم المسح ${data.scanCount} مرات)`);
        setMessageType('success');
      } else if (data.status === "already") {
        setAttended(data.attendedCount);
        setMessage(`✨ تم التحقق بنجاح!\nتم تسجيل حضورك في الضيف\n(تم المسح ${data.scanCount} مرات)`);
        setMessageType('success');
      } else if (data.status === "full") {
        setAttended(data.attendedCount ?? attended);
        setMessage("🚫 اكتمل العدد — لا يمكن قبول المزيد");
        setMessageType('error');
      } else {
        setMessage("❌ لم يتم التعرف على التذكرة");
        setMessageType('error');
      }
    } catch (e: any) {
      setMessage(e.message ?? "خطأ أثناء المسح");
      setMessageType('error');
    } finally {
      setScanLoading(false);
    }
  }

  function handleDetected(text: string) {
    const id = parseTicket(text);
    if (!id) return;

    // إزالة منطق منع التكرار - السماح بمسح نفس التذكرة عدة مرات
    const now = Date.now();
    // إضافة فترة سماح قصيرة لمنع المسح السريع جداً (500ms)
    if (now - lastScanTime < 500) return;

    setLastScanTime(now);
    void sendScan(id);
  }

  async function manualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = parseTicket(manual) || manual.trim();
    if (!id) return;
    await sendScan(id);
    setManual(""); // Clear input after scan
  }

  const progressPercentage = Math.round((attended / capacityMax) * 100);
  const isFull = attended >= capacityMax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 hover:scale-105"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">ماسح التذاكر</h1>
                <p className="text-white/70">إدارة الحضور والتذاكر</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-white">{attended}</p>
              <p className="text-white/70">حاضر من {capacityMax}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-white/70 mb-2">
              <span>التقدم</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  isFull ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-2xl mb-4 animate-bounce-in ${
              messageType === 'success' ? 'bg-green-500/20 text-green-100 border border-green-500/30' :
              messageType === 'error' ? 'bg-red-500/20 text-red-100 border border-red-500/30' :
              messageType === 'warning' ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-500/30' :
              'bg-blue-500/20 text-blue-100 border border-blue-500/30'
            }`}>
              <p className="flex items-center gap-2 whitespace-pre-line">
                {messageType === 'success' && <span>✅</span>}
                {messageType === 'error' && <span>❌</span>}
                {messageType === 'warning' && <span>⚠️</span>}
                {messageType === 'info' && <span>ℹ️</span>}
                {message}
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m0 0V2m0 2h2m0 0v2m0 0V4m-6 16h.01M12 16h.01" />
              </svg>
              مسح QR Code
            </h2>

            {supported ? (
              <div className="space-y-4">
                <div className="relative bg-black rounded-2xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-80 object-cover"
                    muted
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanner overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-4 border-white/50 rounded-2xl animate-pulse">
                      <div className="w-full h-full border-4 border-blue-500 rounded-2xl animate-scan"></div>
                    </div>
                  </div>

                  {scanLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-white mx-auto mb-2"></div>
                        <p className="text-white text-center">جاري المسح...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-white/70 text-sm">ضع رمز QR أمام الكاميرا</p>
                  <p className="text-white/50 text-xs mt-1">يمكن مسح نفس التذكرة عدة مرات</p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-4">
                <p className="text-yellow-100 text-center">
                  جهازك لا يدعم ماسح QR تلقائياً. استخدم الإدخال اليدوي أدناه.
                </p>
              </div>
            )}

            {streamErr && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-4">
                <p className="text-red-100">{streamErr}</p>
              </div>
            )}

            {/* Manual Input */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">إدخال يدوي</h3>
              <form onSubmit={manualSubmit} className="space-y-3">
                <input
                  type="text"
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder="ألصق رابط التذكرة أو المعرف"
                  className="w-full bg-white/20 border-2 border-white/30 rounded-2xl px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:border-white/50 transition-all duration-300"
                  disabled={scanLoading}
                />
                <button
                  type="submit"
                  disabled={!manual.trim() || scanLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {scanLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      تحقق من التذكرة
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-4 border border-green-500/30">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-100">{attended}</p>
                  <p className="text-green-200 text-sm">حاضر</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-lg rounded-2xl p-4 border border-blue-500/30">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-100">{capacityMax - attended}</p>
                  <p className="text-blue-200 text-sm">متبقي</p>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`backdrop-blur-lg rounded-2xl p-6 border-2 ${
              isFull
                ? 'bg-red-500/20 border-red-500/30'
                : 'bg-green-500/20 border-green-500/30'
            }`}>
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isFull ? 'bg-red-500/30' : 'bg-green-500/30'
                }`}>
                  {isFull ? (
                    <svg className="w-8 h-8 text-red-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-green-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${
                  isFull ? 'text-red-100' : 'text-green-100'
                }`}>
                  {isFull ? 'مكتمل العدد' : 'متاح للحجز'}
                </h3>
                <p className={`text-sm ${
                  isFull ? 'text-red-200' : 'text-green-200'
                }`}>
                  {isFull
                    ? 'لا يمكن قبول المزيد من الحضور'
                    : 'يمكن قبول المزيد من الحضور'
                  }
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                إجراءات سريعة
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setMessage(null)}
                  className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  مسح الرسالة
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  تحديث الصفحة
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
