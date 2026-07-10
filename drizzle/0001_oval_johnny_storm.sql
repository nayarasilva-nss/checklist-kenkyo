CREATE TABLE "job_functions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checklist_types" ADD COLUMN "job_function_id" integer;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "job_function_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "unit_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_function_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "job_functions_name_idx" ON "job_functions" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "units_name_idx" ON "units" USING btree ("name");--> statement-breakpoint
ALTER TABLE "checklist_types" ADD CONSTRAINT "checklist_types_job_function_id_job_functions_id_fk" FOREIGN KEY ("job_function_id") REFERENCES "public"."job_functions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_job_function_id_job_functions_id_fk" FOREIGN KEY ("job_function_id") REFERENCES "public"."job_functions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_job_function_id_job_functions_id_fk" FOREIGN KEY ("job_function_id") REFERENCES "public"."job_functions"("id") ON DELETE set null ON UPDATE no action;