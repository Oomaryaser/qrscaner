"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signOut() {
    try {
      setLoading(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-60 ${className}`}
      title="تسجيل الخروج"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span>{loading ? "...جارٍ تسجيل الخروج" : "تسجيل الخروج"}</span>
    </button>
  );
}
