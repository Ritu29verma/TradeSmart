// // index.js
// import './env.js';
// import express from "express";
// import { registerRoutes } from "./routes.js";
// import 'module-alias/register.js';
// import { initDb } from './db.js';
// import cors from 'cors';
// import { initSocket } from "./socket.js";
// import http from "http";


// const app = express();

// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// // Logging middleware
// app.use((req, res, next) => {
//   const start = Date.now();
//   const path = req.path;
//   let capturedJsonResponse;

//   const originalResJson = res.json.bind(res);
//   res.json = function (bodyJson, ...args) {
//     capturedJsonResponse = bodyJson;
//     return originalResJson(bodyJson, ...args);
//   };

//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     if (path.startsWith("/api")) {
//       let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
//       if (capturedJsonResponse) {
//         logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
//       }
//       if (logLine.length > 80) {
//         logLine = logLine.slice(0, 79) + "…";
//       }
//       console.log(logLine);
//     }
//   });

//   next();
// });

// // Initialize DB & routes **before export**
// await initDb();
// await registerRoutes(app);

// // Error handler
// app.use((err, _req, res, _next) => {
//   const status = err.status || err.statusCode || 500;
//   const message = err.message || "Internal Server Error";
//   res.status(status).json({ message });
// });

// const server = http.createServer(app);
// server.app = app;
// initSocket(server);

// // Only start server locally
// if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
//   const port = parseInt(process.env.PORT || "5000", 10);
//   server.listen(port, () => {
//     console.log(`🚀 Server running locally on port ${port}`);
//   });
// }

// export default app;

// index.js
import "./env.js";
import http from "http";
import { createApp } from "./createApp.js";
import { initDb } from "./db.js";
import { initSocket } from "./socket.js";

const app = await createApp();

await initDb();

const server = http.createServer(app);
server.app = app;
initSocket(server);

if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    console.log(`🚀 Server running locally on port ${port}`);
  });
}

export default app;
