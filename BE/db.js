// db.js
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema.js'; // ✅ Don't forget schema
import dotenv from 'dotenv';

dotenv.config();

let dbInstance = null;

export async function initDb() {
  if (dbInstance) return;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    dbInstance = drizzle(client, { schema }); // ✅ include schema explicitly
    console.log("✅ Database connected and Drizzle initialized.");
  } catch (err) {
    console.error("❌ Error initializing database:", err);
    throw err;
  }
}

export function getDb() {
  if (!dbInstance) {
    throw new Error("❌ DB not initialized. Make sure initDb() was called.");
  }
  return dbInstance;
}
