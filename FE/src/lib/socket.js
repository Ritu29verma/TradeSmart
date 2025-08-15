// src/lib/socket.js
// socket.js (frontend)
import { io } from "socket.io-client";

export const socket = io(import.meta.env.NEXT_PUBLIC_BACKEND_URL, {
  transports: ["websocket"], // force WS to avoid polling delays
  withCredentials: true,
});


export const joinNegotiationRoom = (negotiationId) => {
  console.log("[SOCKET] Joining negotiation room:", negotiationId);
socket.emit("joinNegotiationRoom",  negotiationId );
};

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});


