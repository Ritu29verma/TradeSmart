ALTER TABLE "products" ALTER COLUMN "categoryName" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "categoryName" DROP NOT NULL;