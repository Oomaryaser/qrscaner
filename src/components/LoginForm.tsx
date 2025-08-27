"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الدخول");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm">رمز المرور</label>
        <input
          type="password"
          dir="rtl"
          className="w-full border rounded px-3 py-2 bg-transparent"
          placeholder="اكتب رمز المرور"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button disabled={loading || !name.trim()} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
        {loading ? "...جاري" : "دخول"}
      </button>
    </form>
  );
}
