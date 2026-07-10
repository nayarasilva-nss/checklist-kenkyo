CREATE TYPE "public"."checklist_type_kind" AS ENUM('daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."completion_status" AS ENUM('conforme', 'nao-conforme', 'pending');--> statement-breakpoint
CREATE TYPE "public"."history_status" AS ENUM('completed', 'pending');--> statement-breakpoint
CREATE TYPE "public"."profile" AS ENUM('gestor', 'gerente', 'lider');--> statement-breakpoint
CREATE TABLE "checklist_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_type_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"status" "completion_status" DEFAULT 'pending' NOT NULL,
	"justification" text,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "checklist_type_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_type_id" integer NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" "checklist_type_kind" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"status" "history_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"profile" "profile" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_checklist_type_id_checklist_types_id_fk" FOREIGN KEY ("checklist_type_id") REFERENCES "public"."checklist_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_item_id_checklist_type_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."checklist_type_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_type_items" ADD CONSTRAINT "checklist_type_items_checklist_type_id_checklist_types_id_fk" FOREIGN KEY ("checklist_type_id") REFERENCES "public"."checklist_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_items" ADD CONSTRAINT "template_items_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "completions_item_user_date_idx" ON "checklist_completions" USING btree ("item_id","user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");