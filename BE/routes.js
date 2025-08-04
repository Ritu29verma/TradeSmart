import { createServer } from "http";
import { storage } from "./storage.js";
import { authService } from "./services/auth.js";
import { aiService } from "./services/openai.js";
import { authenticateToken, requireRole, optionalAuth } from "./middleware/auth.js";

export async function registerRoutes(app) {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, companyName, role } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create username from email
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);

      const user = await storage.createUser({
        email,
        password,
        username,
        firstName,
        lastName,
        companyName,
        role: role || 'buyer'
      });

      const token = authService.generateToken(user);

      res.status(201).json({
        message: "User created successfully",
        token,
        user: { ...user, password: undefined }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = authService.generateToken(user);

      res.json({
        message: "Login successful",
        token,
        user: { ...user, password: undefined }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { token, role } = req.body;

      const googleUser = await authService.verifyGoogleToken(token);

      let user = await storage.getUserByGoogleId(googleUser.googleId);

      if (!user) {
        // Create new user
        const username = googleUser.email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
        user = await storage.createUser({
          email: googleUser.email,
          username,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          profileImage: googleUser.profileImage,
          googleId: googleUser.googleId,
          isVerified: googleUser.isVerified,
          role: role || 'buyer'
        });
      }

      const authToken = authService.generateToken(user);

      res.json({
        message: "Google login successful",
        token: authToken,
        user: { ...user, password: undefined }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    res.json({ user: { ...req.user, password: undefined } });
  });

  // User routes
  app.put("/api/users/profile", authenticateToken, async (req, res) => {
    try {
      const updates = req.body;
      delete updates.id;
      delete updates.email;
      delete updates.role;

      const user = await storage.updateUser(req.user.id, updates);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { name, description, parentId } = req.body;
      const category = await storage.createCategory(name, description, parentId);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product routes
  app.get("/api/products", optionalAuth, async (req, res) => {
    try {
      const { categoryId, vendorId, search, page = 1, limit = 20 } = req.query;
      const products = await storage.getProducts({
        categoryId,
        vendorId,
        search,
        isActive: true
      });
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", optionalAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Increment view count
      await storage.incrementProductViews(req.params.id);

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", authenticateToken, requireRole(['vendor']), async (req, res) => {
    try {
      const productData = {
        ...req.body,
        vendorId: req.user.id
      };

      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", authenticateToken, requireRole(['vendor']), async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product || product.vendorId !== req.user.id) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updates = req.body;
      delete updates.vendorId;

      const updatedProduct = await storage.updateProduct(req.params.id, updates);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", authenticateToken, requireRole(['vendor']), async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product || product.vendorId !== req.user.id) {
        return res.status(404).json({ message: "Product not found" });
      }

      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // RFQ routes
  app.get("/api/rfqs", authenticateToken, async (req, res) => {
    try {
      const filters = {};
      if (req.user.role === 'buyer') {
        filters.buyerId = req.user.id;
      }

      const rfqs = await storage.getRfqs(filters);
      res.json(rfqs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/rfqs", authenticateToken, requireRole(['buyer']), async (req, res) => {
    try {
      const body = { ...req.body };

      if (body.deadline) {
        const d = new Date(body.deadline);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ message: "Invalid deadline format" });
        }
        body.deadline = d; // make it a Date object
      }

      const rfqData = {
        ...body,
        buyerId: req.user.id
      };

      const rfq = await storage.createRfq(rfqData);
      console.log("req data", rfqData)
      res.status(201).json(rfq);
    } catch (error) {
      console.error("RFQ creation error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/rfqs/incoming", authenticateToken, requireRole(["vendor"]),
    async (req, res) => {
      try {
        const vendorId = req.user.id;
        console.log(`Fetching incoming RFQs for vendorId: ${vendorId}`);

        // 1. Get all product IDs that belong to this vendor
        const vendorProducts = await storage.getProducts({ vendorId });
        const productIds = vendorProducts.map(p => p.id).filter(Boolean);
        console.log(`Vendor products found: ${productIds.length}`, productIds);

        if (productIds.length === 0) {
          console.log("No products found for vendor, returning empty RFQ list.");
          return res.json([]);
        }

        // 2. Fetch RFQs whose productId is one of these
        const incomingRfqs = await storage.getRfqs({
          productId: productIds, // Assumes this can handle array
          status: "open",
        });

        console.log(`RFQs fetched for vendor ${vendorId}: ${incomingRfqs.length}`);
        // Optional: console.log("RFQ details:", incomingRfqs);

        res.json(incomingRfqs);
      } catch (error) {
        console.error("Incoming RFQs error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get("/api/rfqs/:id", authenticateToken, async (req, res) => {
    try {
      const rfq = await storage.getRfq(req.params.id);
      if (!rfq) {
        return res.status(404).json({ message: "RFQ not found" });
      }
      res.json(rfq);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Quote routes
app.get("/api/rfqs/:rfqId/quotes", authenticateToken, async (req, res) => {
  try {
    const rfqId = req.params.rfqId;
    const rfq = await storage.getRfq(rfqId);
    if (!rfq) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    // Only the buyer who created it or relevant vendors may view:
    if (req.user.role === 'buyer' && rfq.buyerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view quotes for this RFQ" });
    }

    // (Optional) vendors could see incoming RFQs they can quote on via a separate route

    const quotes = await storage.getQuotes(rfqId);
    res.json(quotes);
  } catch (error) {
    console.error("Get quotes error:", error);
    res.status(500).json({ message: error.message });
  }
});

app.post( "/api/rfqs/:rfqId/quotes", authenticateToken, requireRole(['vendor']), async (req, res) => {
    try {
      const { rfqId } = req.params;

      // 1. Ensure RFQ exists
      const rfq = await storage.getRfq(rfqId);
      if (!rfq) {
        return res.status(404).json({ message: "RFQ not found" });
      }

      // 2. Only allow quoting on open RFQs
      if (rfq.status !== "open") {
        return res.status(400).json({ message: "RFQ not open for quotes" });
      }

      // 3. Basic validation (you can replace with schema validation)
      const { price, quantity, deliveryTime, validUntil, notes } = req.body;
      if (!price || !quantity) {
        return res
          .status(400)
          .json({ message: "Price and quantity are required" });
      }

      // 4. Normalize date field(s)
      let parsedValidUntil = undefined;
      if (validUntil) {
        const d = new Date(validUntil);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ message: "Invalid validUntil date" });
        }
        parsedValidUntil = d;
      }

      // 5. Check if vendor already submitted a quote for this RFQ
      const existingQuotes = await storage.getQuotesByVendor(req.user.id);
      const existingForThisRfq = existingQuotes.find((q) => q.rfqId === rfqId);

      if (existingForThisRfq) {
        // Optional: treat as update instead of reject
        const updatedQuotePayload = {
          price,
          quantity,
          deliveryTime,
          notes,
          ...(parsedValidUntil && { validUntil: parsedValidUntil }),
        };
        const updated = await storage.updateQuote(existingForThisRfq.id, updatedQuotePayload); // you’d need such a method
        return res.status(200).json(updated);
      }

      // 6. Build quote payload
      const quoteData = {
        rfqId,
        vendorId: req.user.id,
        price,
        quantity,
        deliveryTime,
        notes,
        isAccepted: false,
        ...(parsedValidUntil && { validUntil: parsedValidUntil }),
      };

      // 7. Create the quote
      const quote = await storage.createQuote(quoteData);
      res.status(201).json(quote);
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

app.post("/api/quotes/:id/accept", authenticateToken, requireRole(['buyer']), async (req, res) => {
  try {
    const quoteId = req.params.id;
    const quote = await storage.getQuote(quoteId);
    if (!quote) return res.status(404).json({ message: "Quote not found" });
    if (quote.isAccepted) return res.status(400).json({ message: "Quote already accepted" });

    const rfq = await storage.getRfq(quote.rfqId);
    if (!rfq) return res.status(404).json({ message: "Associated RFQ not found" });
    if (rfq.buyerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to accept this quote" });
    }

    const acceptedQuote = await storage.acceptQuote(quoteId);

    const order = await storage.createOrder({
      buyerId: req.user.id,
      vendorId: quote.vendorId,
      quoteId: quote.id,
      quantity: quote.quantity,
      unitPrice: quote.price,
      totalAmount: (parseFloat(quote.price) * parseInt(quote.quantity)).toString()
    });

    res.json({ quote: acceptedQuote, order });
  } catch (error) {
    console.error("Accept quote error:", error);
    res.status(500).json({ message: error.message });
  }
});


  // Order routes
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const filters = {};
      if (req.user.role === 'buyer') {
        filters.buyerId = req.user.id;
      } else if (req.user.role === 'vendor') {
        filters.vendorId = req.user.id;
      }

      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/orders/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.getOrder(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only vendor can update order status
      if (req.user.role === 'vendor' && order.vendorId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedOrder = await storage.updateOrderStatus(req.params.id, status);
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Negotiation routes
  app.get("/api/negotiations", authenticateToken, async (req, res) => {
    try {
      const filters = {};
      if (req.user.role === 'buyer') {
        filters.buyerId = req.user.id;
      } else if (req.user.role === 'vendor') {
        filters.vendorId = req.user.id;
      }

      const negotiations = await storage.getNegotiations(filters);
      res.json(negotiations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/negotiations", authenticateToken, requireRole(['buyer']), async (req, res) => {
    try {
      const { productId, quantity, initialOffer } = req.body;

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const negotiation = await storage.createNegotiation({
        productId,
        buyerId: req.user.id,
        vendorId: product.vendorId,
        initialPrice: product.price,
        quantity: quantity || 1
      });

      // Add initial message if provided
      if (initialOffer) {
        await storage.addNegotiationMessage(negotiation.id, {
          sender: 'buyer',
          senderId: req.user.id,
          message: `I'd like to negotiate this price. My initial offer is $${initialOffer}`,
          offer: initialOffer
        });
      }

      res.status(201).json(negotiation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/negotiations/:id/message", authenticateToken, async (req, res) => {
    try {
      const { message, offer } = req.body;
      const negotiation = await storage.getNegotiation(req.params.id);

      if (!negotiation) {
        return res.status(404).json({ message: "Negotiation not found" });
      }

      // Check authorization
      if (negotiation.buyerId !== req.user.id && negotiation.vendorId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const senderRole = negotiation.buyerId === req.user.id ? 'buyer' : 'vendor';

      const updatedNegotiation = await storage.addNegotiationMessage(negotiation.id, {
        sender: senderRole,
        senderId: req.user.id,
        message,
        offer: offer || null
      });

      // If offer provided, update current price
      if (offer) {
        await storage.updateNegotiation(negotiation.id, { currentPrice: offer });
      }

      res.json(updatedNegotiation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/negotiations/:id/ai-negotiate", authenticateToken, async (req, res) => {
    try {
      const { message } = req.body;
      const negotiation = await storage.getNegotiation(req.params.id);

      if (!negotiation) {
        return res.status(404).json({ message: "Negotiation not found" });
      }

      const product = await storage.getProduct(negotiation.productId);

      const aiResponse = await aiService.negotiatePrice({
        product,
        currentOffer: negotiation.currentPrice,
        buyerMessage: message,
        negotiationHistory: negotiation.messages || []
      });

      // Add AI response to negotiation
      const updatedNegotiation = await storage.addNegotiationMessage(negotiation.id, {
        sender: 'ai',
        senderId: 'ai-assistant',
        message: aiResponse.response,
        offer: aiResponse.counterOffer,
        aiData: {
          reasoning: aiResponse.reasoning,
          recommendation: aiResponse.acceptanceRecommendation,
          marketJustification: aiResponse.marketJustification
        }
      });

      if (aiResponse.counterOffer) {
        await storage.updateNegotiation(negotiation.id, { currentPrice: aiResponse.counterOffer });
      }

      res.json({ negotiation: updatedNegotiation, aiResponse });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/negotiations/:id/accept", authenticateToken, async (req, res) => {
    try {
      const negotiation = await storage.getNegotiation(req.params.id);

      if (!negotiation) {
        return res.status(404).json({ message: "Negotiation not found" });
      }

      const updatedNegotiation = await storage.updateNegotiation(negotiation.id, {
        isAccepted: true,
        isActive: false,
        finalPrice: negotiation.currentPrice
      });

      // Create order from accepted negotiation
      const order = await storage.createOrder({
        buyerId: negotiation.buyerId,
        vendorId: negotiation.vendorId,
        productId: negotiation.productId,
        quantity: negotiation.quantity,
        unitPrice: negotiation.currentPrice,
        totalAmount: negotiation.currentPrice * negotiation.quantity
      });

      res.json({ negotiation: updatedNegotiation, order });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI Tools routes

// route handler
app.post(
  "/api/ai/price-recommendation",
  authenticateToken,
  requireRole(["vendor"]),
  async (req, res) => {
    try {
      const { productId } = req.body;
      console.log("[PriceRec] incoming productId:", productId, "for user:", req.user?.id);

      const product = await storage.getProduct(productId);
      if (!product) {
        console.warn("[PriceRec] product not found:", productId);
        return res.status(404).json({ message: "Product not found" });
      }
      if (product.vendorId !== req.user.id) {
        console.warn(
          "[PriceRec] ownership mismatch. product.vendorId:",
          product.vendorId,
          "user.id:",
          req.user.id
        );
        return res.status(404).json({ message: "Product not found" });
      }

      let recommendation;
      try {
        recommendation = await aiService.generatePriceRecommendation(product);
      } catch (innerErr) {
        console.error("[PriceRec] AI service failed:", innerErr.message);

        // Quota / billing error -> inform client clearly
        if (innerErr.message.toLowerCase().includes("quota")) {
          return res.status(429).json({
            message: "AI service quota exceeded",
            detail: innerErr.message,
            suggestion: "Check billing/plan or wait before retrying.",
          });
        }

        // Other transient or internal AI service errors
        return res.status(502).json({
          message: "AI service error",
          detail: innerErr.message,
        });
      }

      if (!recommendation) {
        console.warn("[PriceRec] AI service returned empty recommendation");
        return res.status(500).json({ message: "Empty recommendation from AI service" });
      }

      res.json(recommendation);
    } catch (error) {
      console.error("[PriceRec] unexpected error:", error);
      const payload = { message: "Failed to generate price recommendation" };
      if (process.env.NODE_ENV === "development") {
        payload.error = error.message;
      }
      res.status(500).json(payload);
    }
  }
);


  app.post("/api/ai/demand-forecast", authenticateToken, requireRole(['vendor']), async (req, res) => {
    try {
      const { productId } = req.body;
      const product = await storage.getProduct(productId);

      if (!product || product.vendorId !== req.user.id) {
        return res.status(404).json({ message: "Product not found" });
      }

      const priceHistory = await storage.getPriceHistory(productId);
      const forecast = await aiService.forecastDemand(product, priceHistory);
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/risk-assessment", authenticateToken, requireRole(['admin', 'vendor']), async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const orders = await storage.getOrders({ buyerId: userId });
      const assessment = await aiService.generateRiskAssessment(user, orders);
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard stats routes
  app.get("/api/dashboard/vendor-stats", authenticateToken, requireRole(['vendor']), async (req, res) => {
    try {
      const stats = await storage.getVendorStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/buyer-stats", authenticateToken, requireRole(['buyer']), async (req, res) => {
    try {
      const stats = await storage.getBuyerStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/admin-stats", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
