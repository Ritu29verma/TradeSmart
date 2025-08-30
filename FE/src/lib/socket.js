import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket", "polling"], 
  withCredentials: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});


export const joinNegotiationRoom = (negotiationId) => {
  console.log("[SOCKET] Joining negotiation room:", negotiationId);
socket.emit("joinNegotiationRoom",  negotiationId );
};

socket.on("negotiation:message", (data) => {
  console.log("[SOCKET] New negotiation message:", data);
});

// ✅ Listen for deal acceptance
socket.on("deal:accepted", (data) => {
  console.log("[SOCKET] Deal accepted:", data);

  // Example: update UI / toast
  if (window?.toast) {
    window.toast({
      title: "Deal Accepted",
      description: data.message,
    });
  }
});

socket.on("quoteAccepted", (data) => {
  alert("🎉 Your quote was accepted!");
  // maybe refetch quotes or update state directly
});

socket.on("quoteRejected", (data) => {
  alert("❌ Your quote was rejected.");
  // update UI or refetch
});


socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});


