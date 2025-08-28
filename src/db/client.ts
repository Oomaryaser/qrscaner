import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Database calls will fail at runtime.");
}

// Configure Neon client with better timeout and retry settings
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL, {
  fetchOptions: {
    timeout: 30000, // 30 seconds timeout
  },
}) : undefined as any;

export const db = sql ? drizzle(sql) : (undefined as any);

export type DB = typeof db;

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!db) return false;
    // Simple query to test connection
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection check failed:", error);
    return false;
  }
}

