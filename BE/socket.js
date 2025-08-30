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

    io.engine.on("connection_error", (err) => {
  console.log("Engine connection error:", err.code, err.message);
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

  socket.on("accept-deal", async ({ negotiationId, sender, message }) => {
  try {
    console.log(`🤝 Deal accepted in negotiation ${negotiationId}`);

    // Save acceptance message
    await storage.addNegotiationMessage(negotiationId, {
      sender,
      message,
      type: "deal-accepted",
    });

    // Mark negotiation as accepted and inactive
    const negotiation = await storage.updateNegotiationStatus(negotiationId, {
      isActive: false,
      isAccepted: true
    });

    // If negotiation is accepted, create order automatically
    if (negotiation.isAccepted) {
      const newOrder = await storage.createOrder({
        buyerId: negotiation.buyerId,
        vendorId: negotiation.vendorId,
        productId: negotiation.productId,
        quantity: negotiation.quantity,
        unitPrice: negotiation.currentPrice,
        totalAmount: negotiation.currentPrice * negotiation.quantity,
      });

      // Emit updated event with order info
      io.to(`negotiation_${negotiationId}`).emit("deal:accepted", {
        negotiationId,
        sender,
        message,
        order: newOrder,
        timestamp: new Date().toISOString(),
      });

      io.to(`negotiation_${negotiationId}`).emit("quoteAccepted", {
  quote,
  order: newOrder,
  rfqId: negotiation.rfqId, // make sure your negotiation has rfqId
});

    }
  } catch (err) {
    console.error("❌ Error accepting deal:", err);
    socket.emit("error", { error: "Failed to accept deal" });
  }
});

    socket.on("disconnect", () => {
        console.log("🔴 Client disconnected");
    });
});
    server.app.set("io", io);
  });

  
}

