CREATE TABLE "delivery_error_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"total_pedidos" integer NOT NULL,
	"pedidos_com_erro" integer NOT NULL,
	"motivo" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utensil_breakage_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"item" varchar(255) NOT NULL,
	"quantidade" integer NOT NULL,
	"motivo" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delivery_error_records" ADD CONSTRAINT "delivery_error_records_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_error_records" ADD CONSTRAINT "delivery_error_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utensil_breakage_records" ADD CONSTRAINT "utensil_breakage_records_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utensil_breakage_records" ADD CONSTRAINT "utensil_breakage_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;