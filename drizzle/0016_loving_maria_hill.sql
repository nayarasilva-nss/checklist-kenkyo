CREATE TYPE "public"."catalog_unit_measure" AS ENUM('kg', 'g', 'un', 'L', 'ml', 'cx', 'pct');--> statement-breakpoint
CREATE TABLE "catalog_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" integer,
	"unit_measure" "catalog_unit_measure" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_category_id_catalog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."catalog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_categories_name_idx" ON "catalog_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_items_name_idx" ON "catalog_items" USING btree ("name");