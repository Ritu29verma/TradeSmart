CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('open', 'quoted', 'accepted', 'rejected', 'closed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'vendor', 'buyer');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "negotiations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"buyer_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"initial_price" numeric(10, 2) NOT NULL,
	"current_price" numeric(10, 2) NOT NULL,
	"final_price" numeric(10, 2),
	"quantity" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_accepted" boolean DEFAULT false,
	"messages" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"product_id" varchar,
	"quote_id" varchar,
	"order_number" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "order_status" DEFAULT 'pending',
	"shipping_address" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"old_price" numeric(10, 2) NOT NULL,
	"new_price" numeric(10, 2) NOT NULL,
	"reason" text,
	"ai_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"short_description" text,
	"price" numeric(10, 2) NOT NULL,
	"original_price" numeric(10, 2),
	"min_order_quantity" integer DEFAULT 1,
	"stock_quantity" integer DEFAULT 0,
	"images" jsonb,
	"specifications" jsonb,
	"is_active" boolean DEFAULT true,
	"views" integer DEFAULT 0,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"review_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"delivery_time" text,
	"valid_until" timestamp,
	"notes" text,
	"is_accepted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" varchar NOT NULL,
	"product_id" varchar,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"target_price" numeric(10, 2),
	"deadline" timestamp,
	"status" "rfq_status" DEFAULT 'open',
	"requirements" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company_name" text,
	"role" "user_role" DEFAULT 'buyer' NOT NULL,
	"profile_image" text,
	"phone" text,
	"address" jsonb,
	"is_verified" boolean DEFAULT false,
	"google_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
