import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/db/client";

export async function GET() {
  try {
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
      return NextResponse.json({
        status: "connected",
        message: "قاعدة البيانات متصلة بنجاح",
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: "disconnected",
        message: "فشل في الاتصال بقاعدة البيانات",
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  } catch (e: any) {
    console.error("Database health check error:", e);
    return NextResponse.json({
      status: "error",
      message: "خطأ في فحص قاعدة البيانات",
      error: process.env.NODE_ENV === 'development' ? e.message : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
