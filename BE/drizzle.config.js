import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config(); // Load env vars from .env file

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL not found in .env. Please set it.");
}

export default defineConfig({
  out: "./migrations",              // Folder where migration files will go
  schema: "./shared/schema.js",     // Update to .ts if you're using TypeScript
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
