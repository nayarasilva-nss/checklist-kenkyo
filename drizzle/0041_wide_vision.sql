CREATE TABLE "escala_excecoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"tipo" varchar(10) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "escala_vigente_desde" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "folga_dias" integer[] DEFAULT '{}'::integer[] NOT NULL;--> statement-breakpoint
ALTER TABLE "escala_excecoes" ADD CONSTRAINT "escala_excecoes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escala_excecoes" ADD CONSTRAINT "escala_excecoes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "escala_excecoes_user_date_idx" ON "escala_excecoes" USING btree ("user_id","date");
UPDATE "organizations" SET "escala_vigente_desde" = '2026-12-01';
