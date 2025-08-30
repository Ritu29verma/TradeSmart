import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "vendor", "buyer"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]);
export const rfqStatusEnum = pgEnum("rfq_status", ["open", "quoted", "accepted", "rejected", "closed"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  companyName: text("company_name"),
  role: userRoleEnum("role").notNull().default("buyer"),
  profileImage: text("profile_image"),
  phone: text("phone"),
  address: jsonb("address"),
  isVerified: boolean("is_verified").default(false),
  googleId: text("google_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  parentId: varchar("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  categoryName: varchar("categoryName",{ length: 255 }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  minOrderQuantity: integer("min_order_quantity").default(1),
  stockQuantity: integer("stock_quantity").default(0),
  images: jsonb("images"),
  specifications: jsonb("specifications"),
  isActive: boolean("is_active").default(true),
  views: integer("views").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0.00'),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rfqs = pgTable("rfqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull(),
  productId: varchar("product_id"),
  referenceProductId: varchar("reference_product_id"), 
  title: text("title").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }),
  deadline: timestamp("deadline"),
  status: rfqStatusEnum("status").default("open"),
  requirements: jsonb("requirements"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: varchar("rfq_id").notNull(),
  productId: varchar("product_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  deliveryTime: text("delivery_time"),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: varchar("rfq_id").references(() => rfqs.id),
  buyerId: varchar("buyer_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  productId: varchar("product_id"),
  quoteId: varchar("quote_id"),
  orderNumber: text("order_number").notNull().unique(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending"),
  shippingAddress: jsonb("shipping_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const negotiations = pgTable("negotiations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: varchar("rfq_id").notNull().references(() => rfqs.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  initialPrice: decimal("initial_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").notNull(),
  isActive: boolean("is_active").default(true),
  isAccepted: boolean("is_accepted").default(false),
  messages: jsonb("messages"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  oldPrice: decimal("old_price", { precision: 10, scale: 2 }).notNull(),
  newPrice: decimal("new_price", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  rfqs: many(rfqs),
  quotes: many(quotes),
  buyerOrders: many(orders, { relationName: "buyerOrders" }),
  vendorOrders: many(orders, { relationName: "vendorOrders" }),
  buyerNegotiations: many(negotiations, { relationName: "buyerNegotiations" }),
  vendorNegotiations: many(negotiations, { relationName: "vendorNegotiations" }),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(users, { fields: [products.vendorId], references: [users.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  rfqs: many(rfqs),
  orders: many(orders),
  negotiations: many(negotiations),
  priceHistory: many(priceHistory),
}));

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  buyer: one(users, { fields: [rfqs.buyerId], references: [users.id] }),
  product: one(products, { fields: [rfqs.productId], references: [products.id] }),
  quotes: many(quotes),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  rfq: one(rfqs, { fields: [quotes.rfqId], references: [rfqs.id] }),
  vendor: one(users, { fields: [quotes.vendorId], references: [users.id] }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.id], relationName: "buyerOrders" }),
  vendor: one(users, { fields: [orders.vendorId], references: [users.id], relationName: "vendorOrders" }),
  product: one(products, { fields: [orders.productId], references: [products.id] }),
  quote: one(quotes, { fields: [orders.quoteId], references: [quotes.id] }),
}));

export const negotiationsRelations = relations(negotiations, ({ one }) => ({
  product: one(products, { fields: [negotiations.productId], references: [products.id] }),
  buyer: one(users, { fields: [negotiations.buyerId], references: [users.id], relationName: "buyerNegotiations" }),
  vendor: one(users, { fields: [negotiations.vendorId], references: [users.id], relationName: "vendorNegotiations" }),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(products, { fields: [priceHistory.productId], references: [products.id] }),
}));

// Insert schemas (optional – you can remove these if not using them in JavaScript)
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  rating: true,
  reviewCount: true,
});

export const insertRfqSchema = createInsertSchema(rfqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  isAccepted: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  orderNumber: true,
  status: true,
});

export const insertNegotiationSchema = createInsertSchema(negotiations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  isAccepted: true,
  finalPrice: true,
});
