CREATE TYPE "public"."requisicao_status" AS ENUM('aberta', 'conferida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."requisicao_tipo" AS ENUM('interna', 'externa');--> statement-breakpoint
CREATE TABLE "requisicao_itens" (
	"id" serial PRIMARY KEY NOT NULL,
	"requisicao_id" integer NOT NULL,
	"catalog_item_id" integer,
	"nome" varchar(255) NOT NULL,
	"unidade_medida" "catalog_unit_measure" NOT NULL,
	"qtd_pedida" numeric(10, 2) NOT NULL,
	"qtd_conferida" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "requisicoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" "requisicao_tipo" NOT NULL,
	"unit_id" integer NOT NULL,
	"requester_id" integer NOT NULL,
	"urgente" boolean DEFAULT false NOT NULL,
	"observacao" text DEFAULT '' NOT NULL,
	"status" "requisicao_status" DEFAULT 'aberta' NOT NULL,
	"conferido_por_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp,
	"concluido_em" timestamp
);
--> statement-breakpoint
ALTER TABLE "requisicao_itens" ADD CONSTRAINT "requisicao_itens_requisicao_id_requisicoes_id_fk" FOREIGN KEY ("requisicao_id") REFERENCES "public"."requisicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisicao_itens" ADD CONSTRAINT "requisicao_itens_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD CONSTRAINT "requisicoes_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD CONSTRAINT "requisicoes_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD CONSTRAINT "requisicoes_conferido_por_id_users_id_fk" FOREIGN KEY ("conferido_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;