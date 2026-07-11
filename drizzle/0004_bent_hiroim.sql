CREATE TABLE "filleting_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"fish_type" varchar(255) NOT NULL,
	"recebido_kg" numeric(10, 2) NOT NULL,
	"file_kg" numeric(10, 2) NOT NULL,
	"ponta_clara_kg" numeric(10, 2) NOT NULL,
	"ponta_escura_kg" numeric(10, 2) NOT NULL,
	"peles_kg" numeric(10, 2) NOT NULL,
	"raspas_kg" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "filleting_records" ADD CONSTRAINT "filleting_records_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filleting_records" ADD CONSTRAINT "filleting_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;