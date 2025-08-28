import { getUserIdFromCookies } from "@/lib/session";
import LoginForm from "@/components/LoginForm";
import CreateEventForm from "@/components/CreateEventForm";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export default async function Home() {
  const uid = await getUserIdFromCookies();
  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 animate-slideIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                مرحباً بك
              </h1>
              <p className="text-gray-600">يرجى تسجيل الدخول للمتابعة</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  let myEvents: { id: string; startAtUtc: Date; createdAt: Date; capacityMax: number; attendedCount: number }[] = [];
  try {
    myEvents = await db
      .select({ id: events.id, startAtUtc: events.startAtUtc, createdAt: events.createdAt, capacityMax: events.capacityMax, attendedCount: events.attendedCount })
      .from(events)
      .where(eq(events.ownerId, uid))
      .orderBy(desc(events.createdAt));
  } catch {
    myEvents = [];
  }

  const totalAttended = myEvents.reduce((sum, ev) => sum + (ev.attendedCount || 0), 0);
  const totalCapacity = myEvents.reduce((sum, ev) => sum + (ev.capacityMax || 0), 0);
  const attendanceRate = totalCapacity > 0 ? Math.round((totalAttended / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 hover-lift">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              لوحة التحكم
            </h1>
            <p className="text-gray-600">إنشاء وإدارة فعالياتك بسهولة</p>
          </div>
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{myEvents.length}</div>
              <div className="text-xs text-gray-500">ضيف</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalAttended}</div>
              <div className="text-xs text-gray-500">حضور</div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي الفعاليات</p>
                <p className="text-2xl font-bold">{myEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">إجمالي الحضور</p>
                <p className="text-2xl font-bold">{totalAttended}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">معدل الحضور</p>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <CreateEventForm />
      </div>

      {/* Events History */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">سجل الفعاليات</h2>
            <p className="text-gray-600">جميع فعالياتك السابقة والحالية</p>
          </div>
          {myEvents.length > 0 && (
            <div className="flex items-center space-x-reverse space-x-2 text-sm text-gray-600">
              <span className="status-dot success"></span>
              <span>إجمالي الحضور: {totalAttended}</span>
            </div>
          )}
        </div>

        {myEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد فعاليات</h3>
            <p className="text-gray-500">ابدأ بإنشاء فعاليتك الأولى</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myEvents.map((ev, index) => {
              const startLocal = new Date(ev.startAtUtc.getTime() + 3 * 60 * 60 * 1000);
              const createdLocal = new Date(ev.createdAt.getTime() + 3 * 60 * 60 * 1000);
              const startStr = startLocal.toLocaleString("ar", { 
                year: "numeric", 
                month: "2-digit", 
                day: "2-digit", 
                hour: "2-digit", 
                minute: "2-digit", 
                hour12: true 
              }) + " GMT+3";
              const createdStr = createdLocal.toLocaleString("ar", { 
                year: "numeric", 
                month: "2-digit", 
                day: "2-digit", 
                hour: "2-digit", 
                minute: "2-digit", 
                hour12: true 
              }) + " GMT+3";

              const attendancePercentage = (ev.attendedCount / ev.capacityMax) * 100;
              const isUpcoming = startLocal.getTime() > Date.now();
              const isActive = Math.abs(startLocal.getTime() - Date.now()) < 3 * 60 * 60 * 1000; // within 3 hours
              
              return (
                <div key={ev.id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-100 p-6 hover-lift transition-all duration-300 animate-slideIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">ضيف #{index + 1}</h3>
                        <div className="flex items-center space-x-reverse space-x-2">
                          {isActive && <span className="status-dot success animate-pulse-slow"></span>}
                          {isUpcoming && !isActive && <span className="status-dot warning"></span>}
                          {!isUpcoming && !isActive && <span className="status-dot info"></span>}
                          <span className="text-sm text-gray-600">
                            {isActive ? 'نشطة الآن' : isUpcoming ? 'قادمة' : 'منتهية'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{ev.attendedCount}</div>
                      <div className="text-sm text-gray-500">من {ev.capacityMax}</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">معدل الحضور</span>
                      <span className="text-sm font-medium text-gray-900">{Math.round(attendancePercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${attendancePercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <div className="flex items-center space-x-reverse space-x-2 mb-1">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-blue-900">موعد الضيف</span>
                      </div>
                      <p className="text-sm text-blue-700">{startStr}</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-3">
                      <div className="flex items-center space-x-reverse space-x-2 mb-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-green-900">تاريخ الإنشاء</span>
                      </div>
                      <p className="text-sm text-green-700">{createdStr}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Link 
                      href={`/e/${ev.id}`} 
                      className="inline-flex items-center space-x-reverse space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl btn-hover-scale focus-ring"
                    >
                      <span>رابط الضيوف</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-1M14 5l7 7m0 0l-7 7m7-7H8" />
                      </svg>
                    </Link>
                    
                    <Link 
                      href={`/e/${ev.id}/scan`} 
                      className="inline-flex items-center space-x-reverse space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl btn-hover-scale focus-ring"
                    >
                      <span>مسح QR</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
