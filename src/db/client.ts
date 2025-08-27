import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Database calls will fail at runtime.");
}

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : undefined as any;

export const db = sql ? drizzle(sql) : (undefined as any);

export type DB = typeof db;

