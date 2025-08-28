import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-400 to-pink-600 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">الصفحة غير موجودة</h2>
        <p className="text-gray-600 mb-8">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105"
          >
            العودة للصفحة الرئيسية
          </Link>

          <button
            onClick={() => window.history.back()}
            className="block w-full bg-white/50 hover:bg-white/70 text-gray-700 font-medium py-3 px-6 rounded-2xl transition-all duration-300 border border-gray-200"
          >
            العودة للصفحة السابقة
          </button>
        </div>
      </div>
    </div>
  );
}
