import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
  console.log("✅ Loaded .env file locally");
} else {
  console.log("✅ Using Vercel environment variables");
}