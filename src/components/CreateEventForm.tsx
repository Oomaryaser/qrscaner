"use client";
import { useEffect, useMemo, useState } from "react";

function formatDefault() {
  return { date: "2025-08-28", time: "18:30" };
}

export default function CreateEventForm() {
  const def = useMemo(formatDefault, []);
  const [date, setDate] = useState(def.date);
  const [time, setTime] = useState(def.time);
  const [capacity, setCapacity] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setLink(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, capacity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إنشاء الفعالية");
      const url = `${window.location.origin}/e/${data.id}`;
      setLink(url);
    } catch (err: any) {
      setError(err.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">مرحباً! أنشئ فعالية جديدة</h1>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">التاريخ (GMT+3)</label>
            <input type="date" className="w-full border rounded px-3 py-2 bg-transparent" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">الوقت (GMT+3)</label>
            <input type="time" className="w-full border rounded px-3 py-2 bg-transparent" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">الحد الأقصى للحضور</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded px-3 py-2 bg-transparent"
            value={capacity}
            onChange={(e) => setCapacity(Math.max(1, Number(e.target.value || 1)))}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50">
          {loading ? "...جاري" : "إنشاء الرابط"}
        </button>
      </form>

      {link && (
        <div className="rounded border p-3">
          <div className="text-sm mb-1">رابط الضيوف:</div>
          <a href={link} className="text-blue-600 underline break-all">{link}</a>
        </div>
      )}
    </div>
  );
}

