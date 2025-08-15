import { storage } from "./storage.js";

export function initSocket(server) {
  import("socket.io").then(({ Server }) => {
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

 io.on("connection", (socket) => {
    console.log("🟢 New client connected", socket.id);

    socket.on("joinNegotiationRoom", ( negotiationId ) => {
        const roomName = `negotiation_${negotiationId}`;
        socket.join(roomName);
        console.log(`✅ User joined room: ${roomName}`);
          console.log("📌 Current rooms:", socket.rooms);
    });

    socket.on("negotiation:message", async ({ negotiationId, sender, senderId, message, offer }) => {
    // Save message to DB
    await storage.addNegotiationMessage(negotiationId, { sender, senderId, message, offer });

    // Emit to all in the negotiation room
    io.to(`negotiation_${negotiationId}`).emit("negotiation:message", {
      negotiationId,
      sender,
      senderId,
      message,
      offer,
      timestamp: new Date().toISOString()
    });
  });

    socket.on("disconnect", () => {
        console.log("🔴 Client disconnected");
    });
});

    // Return io so it can be used in routes
    server.app.set("io", io);
  });
}
