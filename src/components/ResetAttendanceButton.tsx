"use client";

import { useState } from "react";

export default function ResetAttendanceButton({ eventId, onReset }: { eventId: string; onReset?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function doReset() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "فشل إعادة التعيين");
      setConfirming(false);
      if (onReset) {
        onReset();
      } else if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (e: any) {
      setError(e.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={doReset}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white disabled:opacity-60"
        >
          {loading ? "...جاري إعادة التعيين" : "تأكيد إعادة التعيين"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-900"
        >
          إلغاء
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        title="إعادة تعيين الحضور إلى صفر"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center  space-x-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>تصفير الحضور</span>
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
