ALTER TABLE "organizations" ADD COLUMN "erp_api_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "erp_api_token" text;--> statement-breakpoint
ALTER TABLE "shift_log_pendencias" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "shift_log_pendencias" ADD CONSTRAINT "shift_log_pendencias_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;