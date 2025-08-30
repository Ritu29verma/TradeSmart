// import { db } from "./db.js";
import { initDb, getDb } from './db.js';

await initDb();

const db = getDb();
import 'module-alias/register.js';
import { users, products, categories, rfqs, quotes, orders, negotiations, priceHistory } from "./shared/schema.js";
import { eq, and, desc, asc, ilike, sql, count, or , ne } from "drizzle-orm";
import bcrypt from "bcrypt";

// console.log("Users table:", users);

export class DatabaseStorage {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByGoogleId(googleId) {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser) {
    const hashedPassword = insertUser.password ? await bcrypt.hash(insertUser.password, 10) : null;
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id, updates) {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyPassword(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getUsersByRoles(roles) {
    const db = getDb();
    return await db.query.users.findMany({
      where: (users, { inArray }) => inArray(users.role, roles),
    });
  }
  // Category operations
  async getCategories() {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(name, description, parentId = null) {
    const [category] = await db
      .insert(categories)
      .values({ name, description, parentId })
      .returning();
    return category;
  }

  async updateCategory(id, name, description, parentId) {
    const [category] = await db
      .update(categories)
      .set({ name, description, parentId: parentId || null, updatedAt: new Date(), })
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id) {
    const deleted = await db.delete(categories).where(eq(categories.id, id)).returning();
    return deleted.length > 0;
  }

  // Product operations
  async getProducts(filters = {}) {
    let query = db.select().from(products);

    if (filters.categoryId) {
      query = query.where(eq(products.categoryId, filters.categoryId));
    }

    if (filters.categoryName) {
      query = query.where(eq(products.categoryName, filters.categoryName));
    }

    if (filters.vendorId) {
      query = query.where(eq(products.vendorId, filters.vendorId));
    }

    if (filters.search) {
      query = query.where(ilike(products.name, `%${filters.search}%`));
    }

    if (filters.isActive !== undefined) {
      query = query.where(eq(products.isActive, filters.isActive));
    }

    return await query.orderBy(desc(products.createdAt));
  }

  async getProduct(id) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

async getProductsByVendor(vendorId) {
  return await db
    .select()
    .from(products)
    .where(eq(products.vendorId, vendorId));
}

  async createProduct(insertProduct) {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id, updates) {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id) {
    await db.delete(products).where(eq(products.id, id));
  }

  async incrementProductViews(id) {
    await db
      .update(products)
      .set({ views: sql`${products.views} + 1` })
      .where(eq(products.id, id));
  }

  // RFQ operations
  async getRfqs(filters = {}) {
    let query = db.select().from(rfqs);

    if (filters.buyerId) {
      query = query.where(eq(rfqs.buyerId, filters.buyerId));
    }

    if (filters.status) {
      query = query.where(eq(rfqs.status, filters.status));
    }

    if (filters.productId) {
      if (Array.isArray(filters.productId)) {
        // query = query.where(rfqs.productId.in(filters.productId));
        const conditions = filters.productId.map(id => eq(rfqs.productId, id));
        query = query.where(or(...conditions));
      } else if (!Array.isArray(filters.productId)) {
        query = query.where(eq(rfqs.productId, filters.productId));
      }
    }

    return await query.orderBy(desc(rfqs.createdAt));
  }

  async getRfq(id) {
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    return rfq || undefined;
  }

  async createRfq(insertRfq) {
    const [rfq] = await db
      .insert(rfqs)
      .values(insertRfq)
      .returning();
    return rfq;
  }

  async updateRfq(id, updates) {
    const [rfq] = await db
      .update(rfqs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rfqs.id, id))
      .returning();
    return rfq;
  }

  async rejectOtherQuotes(rfqId, acceptedQuoteId) {
  return db.update(quotes)
    .set({ status: "rejected", isAccepted: false , updatedAt: new Date() })
    .where(and(
      eq(quotes.rfqId, rfqId),
      ne(quotes.id, acceptedQuoteId) // exclude accepted quote
    ))
    .returning();
}

  // Quote operations
  async getQuotes(rfqId) {
    return await db.select().from(quotes).where(eq(quotes.rfqId, rfqId)).orderBy(asc(quotes.price));
  }

  async getQuote(id) {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async getQuotesByVendor(vendorId) {
    return await db.select().from(quotes).where(eq(quotes.vendorId, vendorId)).orderBy(desc(quotes.createdAt));
  }

  async updateQuote(id, data) {
    const [quote] = await db.update(quotes).set(data).where(eq(quotes.id, id)).returning();
    return quote;
  }

  async createQuote(insertQuote) {
    const [quote] = await db
      .insert(quotes)
      .values(insertQuote)
      .returning();
    return quote;
  }

async acceptQuote(id) {
  // 1. Get the quote
  const existing = await this.getQuote(id);
  if (!existing) return null;
  if (existing.isAccepted) return existing;

  // 2. Accept this quote
  const [quote] = await db
    .update(quotes)
    .set({ isAccepted: true, updatedAt: new Date() })
    .where(eq(quotes.id, id))
    .returning();
   const rejectedQuotes = await this.rejectOtherQuotes(existing.rfqId, existing.id);
  // 3. Reject all other quotes for this RFQ
  await this.rejectOtherQuotes(existing.rfqId, existing.id);

  // 4. Update RFQ status -> "closed" or "fulfilled"
  await this.updateRfq(existing.rfqId, { status: "accepted" });
   const totalAmount = (parseFloat(existing.price) * parseInt(existing.quantity)).toString();
   const rfq = await this.getRfq(existing.rfqId);
  // 5. Create an Order from the accepted quote
  const order = await this.createOrder({
   buyerId: rfq.buyerId, 
      vendorId: existing.vendorId,
      productId: existing.productId,
      rfqId: existing.rfqId,
      quoteId: existing.id,
      quantity: existing.quantity,
      unitPrice: existing.price,
      totalAmount,
      status: "pending"
    });

  return { quote, rejectedQuotes, order };
}

  // Order operations
  async getOrders(filters = {}) {
    let query = db.select().from(orders);

    if (filters.buyerId) {
      query = query.where(eq(orders.buyerId, filters.buyerId));
    }

    if (filters.vendorId) {
      query = query.where(eq(orders.vendorId, filters.vendorId));
    }

    if (filters.status) {
      query = query.where(eq(orders.status, filters.status));
    }

    return await query.orderBy(desc(orders.createdAt));
  }

  async getOrder(id) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(insertOrder) {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const [order] = await db
      .insert(orders)
      .values({ ...insertOrder, orderNumber })
      .returning();
    return order;
  }

  async updateOrderStatus(id, status) {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  // Negotiation operations
  async getNegotiations(filters = {}) {
    let query = db.select().from(negotiations);

    if (filters.buyerId) {
      query = query.where(eq(negotiations.buyerId, filters.buyerId));
    }

    if (filters.vendorId) {
      query = query.where(eq(negotiations.vendorId, filters.vendorId));
    }

    if (filters.productId) {
      query = query.where(eq(negotiations.productId, filters.productId));
    }

    if (filters.isActive !== undefined) {
      query = query.where(eq(negotiations.isActive, filters.isActive));
    }

    return await query.orderBy(desc(negotiations.updatedAt));
  }

  async acceptNegotiation(negotiationId) {
  // 1. Get negotiation details
  const [negotiation] = await db
    .select()
    .from(negotiations)
    .where(eq(negotiations.id, negotiationId))
    .limit(1);

  if (!negotiation) {
    throw new Error("Negotiation not found");
  }

  // 2. Update negotiation -> mark accepted
  await db
    .update(negotiations)
    .set({
      isAccepted: true,
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(negotiations.id, negotiationId));

  // 3. Insert into orders table
  const [order] = await db
    .insert(orders)
    .values({
      buyerId: negotiation.buyerId,
      vendorId: negotiation.vendorId,
      productId: negotiation.productId,
      quoteId: negotiation.id,
      orderNumber: `ORD-${Date.now()}`, // you can use a better sequence
      quantity: negotiation.quantity,
      unitPrice: negotiation.finalPrice ?? negotiation.currentPrice,
      totalAmount: (negotiation.quantity *
        (negotiation.finalPrice ?? negotiation.currentPrice)),
      status: "pending",
      shippingAddress: negotiation.shippingAddress ?? {},
      notes: null,
    })
    .returning();

  return order;
}

  async getNegotiation(id) {
    const [negotiation] = await db.select().from(negotiations).where(eq(negotiations.id, id));
    return negotiation || undefined;
  }

  async createNegotiation(insertNegotiation) {
    const [negotiation] = await db
      .insert(negotiations)
      .values({
        ...insertNegotiation,
        currentPrice: insertNegotiation.initialPrice,
        messages: []
      })
      .returning();
    return negotiation;
  }

  async updateNegotiation(id, updates) {
    const [negotiation] = await db
      .update(negotiations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(negotiations.id, id))
      .returning();
    return negotiation;
  }

  async addNegotiationMessage(id, message) {
    const negotiation = await this.getNegotiation(id);
    if (!negotiation) return null;

    const messages = negotiation.messages || [];
    messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });

    return await this.updateNegotiation(id, { messages });
  }

async updateNegotiationStatus(id, updates) {
  const [negotiation] = await db
    .update(negotiations)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(negotiations.id, id))
    .returning();

  return negotiation;
}

async getNegotiationById(negotiationId) {
  const [negotiation] = await db
    .select()
    .from(negotiations)
     .where(eq(negotiations.id, negotiationId))   // replace `id` with your actual PK column
    .limit(1);

  return negotiation || null;
}


  // Price history operations
  async addPriceHistory(productId, oldPrice, newPrice, reason, aiGenerated = false) {
    const [entry] = await db
      .insert(priceHistory)
      .values({ productId, oldPrice, newPrice, reason, aiGenerated })
      .returning();
    return entry;
  }

  async getPriceHistory(productId) {
    return await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.productId, productId))
      .orderBy(desc(priceHistory.createdAt));
  }

  // Analytics operations
  async getVendorStats(vendorId) {
    const [productCount] = await db
      .select({ count: count() })
      .from(products)
      .where(and(eq(products.vendorId, vendorId), eq(products.isActive, true)));

    const [orderStats] = await db
      .select({
        count: count(),
        total: sql`COALESCE(SUM(${orders.totalAmount}), 0)`
      })
      .from(orders)
      .where(eq(orders.vendorId, vendorId));

    const [activeRfqs] = await db
      .select({ count: count() })
      .from(rfqs)
      .innerJoin(products, eq(rfqs.productId, products.id))
      .where(and(eq(products.vendorId, vendorId), eq(rfqs.status, 'open')));

    return {
      totalProducts: productCount.count,
      totalOrders: orderStats.count,
      totalRevenue: orderStats.total,
      activeRfqs: activeRfqs.count
    };
  }

  async getBuyerStats(buyerId) {
    const [orderStats] = await db
      .select({
        count: count(),
        total: sql`COALESCE(SUM(${orders.totalAmount}), 0)`
      })
      .from(orders)
      .where(eq(orders.buyerId, buyerId));

    const [rfqStats] = await db
      .select({ count: count() })
      .from(rfqs)
      .where(eq(rfqs.buyerId, buyerId));

    return {
      totalOrders: orderStats.count,
      totalSpent: orderStats.total,
      totalRfqs: rfqStats.count
    };
  }

  async getAdminStats() {
    const [userStats] = await db.select({ count: count() }).from(users);
    const [productStats] = await db.select({ count: count() }).from(products);
    const [orderStats] = await db.select({
      count: count(),
      total: sql`COALESCE(SUM(${orders.totalAmount}), 0)`
    }).from(orders);

    return {
      totalUsers: userStats.count,
      totalProducts: productStats.count,
      totalOrders: orderStats.count,
      totalRevenue: orderStats.total
    };
  }
}

export const storage = new DatabaseStorage();
