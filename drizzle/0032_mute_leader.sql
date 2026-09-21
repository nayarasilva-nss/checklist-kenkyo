CREATE TYPE "public"."audit_answer_status" AS ENUM('conforme', 'parcial', 'nao_conforme', 'nao_aplica');--> statement-breakpoint
CREATE TABLE "audit_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" integer NOT NULL,
	"group_name" varchar(255) NOT NULL,
	"group_position" integer DEFAULT 0 NOT NULL,
	"item_label" text NOT NULL,
	"item_position" integer DEFAULT 0 NOT NULL,
	"status" "audit_answer_status",
	"note" text DEFAULT '' NOT NULL,
	"photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"label" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"auditor_id" integer NOT NULL,
	"visit_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'rascunho' NOT NULL,
	"score_percent" integer,
	"comments" text DEFAULT '' NOT NULL,
	"action_plan" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finalized_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "audit_answers" ADD CONSTRAINT "audit_answers_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_groups" ADD CONSTRAINT "audit_groups_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_group_id_audit_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."audit_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_auditor_id_users_id_fk" FOREIGN KEY ("auditor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;