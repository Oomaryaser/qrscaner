import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DatabaseStatusIndicator from "@/components/DatabaseStatusIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "حضور - إنشـاء ضيف",
  description: "تسجيل حضور عبر رمز QR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen`}
      >
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400 to-blue-600 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full opacity-10 blur-3xl"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-reverse space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    نظام الحضور
                  </h1>
                  <p className="text-sm text-gray-600">إدارة الفعاليات بكود QR</p>
                </div>
              </div>
              <div className="status-dot success"></div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="animate-fadeIn">
              {children}
            </div>
          </div>
        </main>

        {/* Database Status Indicator */}
        <DatabaseStatusIndicator />

        {/* Footer */}
        <footer className="relative z-10 backdrop-blur-sm border-t border-white/20 mt-16">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="text-center text-sm text-gray-600">
              <p>© 2025 نظام الحضور - جميع الحقوق محفوظة</p>
              <div className="mt-2 flex items-center justify-center space-x-reverse space-x-4">
                <span className="flex items-center">
                  <span className="status-dot success"></span>
                  متصل
                </span>
                <span>|</span>
                <span>آمن ومشفر</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
