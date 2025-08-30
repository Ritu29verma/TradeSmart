ALTER TABLE "negotiations" ADD COLUMN "rfq_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "rfq_id" varchar;--> statement-breakpoint
ALTER TABLE "rfqs" ADD COLUMN "reference_product_id" varchar;--> statement-breakpoint
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;