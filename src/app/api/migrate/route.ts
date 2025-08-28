import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Check current schema of tickets table
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tickets'
      ORDER BY ordinal_position;
    `);

    // Try to add the missing columns
    try {
      await db.execute(sql`
        ALTER TABLE tickets
        ADD COLUMN IF NOT EXISTS scan_count INTEGER NOT NULL DEFAULT 0;
      `);

      return NextResponse.json({
        success: true,
        message: "Migration applied successfully",
        columns: result.rows
      });
    } catch (migrationError: any) {
      return NextResponse.json({
        success: false,
        error: "Migration failed",
        details: migrationError.message,
        currentColumns: result.rows
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Database connection failed",
      details: error.message
    }, { status: 500 });
  }
}
