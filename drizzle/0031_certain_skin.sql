DROP INDEX "catalog_categories_name_idx";--> statement-breakpoint
DROP INDEX "catalog_items_name_idx";--> statement-breakpoint
DROP INDEX "job_functions_name_idx";--> statement-breakpoint
DROP INDEX "units_name_idx";--> statement-breakpoint
ALTER TABLE "anomalies" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "catalog_categories" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "checklist_types" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "delivery_error_records" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "filleting_records" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "history" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "job_functions" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "resto_ingesta_records" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "shift_logs" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "utensil_breakage_records" ADD COLUMN "organization_id" integer;--> statement-breakpoint
UPDATE "anomalies" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "catalog_categories" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "catalog_items" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "checklist_types" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "delivery_error_records" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "documents" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "filleting_records" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "history" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "job_functions" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "requisicoes" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "resto_ingesta_records" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "shift_logs" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "solicitacoes" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "units" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
UPDATE "utensil_breakage_records" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'kenkyo') WHERE "organization_id" IS NULL;--> statement-breakpoint
ALTER TABLE "anomalies" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_categories" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_items" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "checklist_types" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_error_records" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "filleting_records" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "history" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_functions" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "requisicoes" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "resto_ingesta_records" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_logs" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "utensil_breakage_records" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_categories" ADD CONSTRAINT "catalog_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_types" ADD CONSTRAINT "checklist_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_error_records" ADD CONSTRAINT "delivery_error_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filleting_records" ADD CONSTRAINT "filleting_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_functions" ADD CONSTRAINT "job_functions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD CONSTRAINT "requisicoes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resto_ingesta_records" ADD CONSTRAINT "resto_ingesta_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_logs" ADD CONSTRAINT "shift_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utensil_breakage_records" ADD CONSTRAINT "utensil_breakage_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_categories_org_name_idx" ON "catalog_categories" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_items_org_name_idx" ON "catalog_items" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "job_functions_org_name_idx" ON "job_functions" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "units_org_name_idx" ON "units" USING btree ("organization_id","name");
