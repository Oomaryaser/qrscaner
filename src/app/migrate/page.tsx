import Link from "next/link";

export default function MigratePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">تطبيق تحديثات قاعدة البيانات</h1>
        <p className="text-gray-600 mb-6">
          اضغط على الزر أدناه لتطبيق التحديثات المطلوبة على قاعدة البيانات
        </p>

        <button
          onClick={async () => {
            try {
              const response = await fetch('/api/migrate');
              const data = await response.json();

              if (data.success) {
                alert('✅ تم تطبيق التحديثات بنجاح!');
                window.location.href = '/';
              } else {
                alert('❌ فشل في تطبيق التحديثات: ' + data.details);
              }
            } catch (error) {
              alert('❌ خطأ في الاتصال: ' + (error as Error).message);
            }
          }}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg mb-4"
        >
          تطبيق التحديثات
        </button>

        <Link
          href="/"
          className="block w-full px-6 py-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-all duration-300"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
