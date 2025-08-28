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
      // Add missing columns to tickets
      await db.execute(sql`
        ALTER TABLE tickets
        ADD COLUMN IF NOT EXISTS scan_count INTEGER NOT NULL DEFAULT 0;
      `);

      // Add missing columns to events
      await db.execute(sql`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS name VARCHAR(200) NOT NULL DEFAULT '';
      `);
      await db.execute(sql`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL;
      `);

      // Re-check schema of both tables
      const ticketsCols = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'tickets'
        ORDER BY ordinal_position;
      `);
      const eventsCols = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'events'
        ORDER BY ordinal_position;
      `);

      return NextResponse.json({
        success: true,
        message: "Migration applied successfully",
        ticketsColumns: ticketsCols.rows,
        eventsColumns: eventsCols.rows
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
