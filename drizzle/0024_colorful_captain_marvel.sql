CREATE TYPE "public"."solicitacao_status" AS ENUM('aberta', 'aprovada', 'reprovada', 'cancelada');--> statement-breakpoint
CREATE TABLE "solicitacao_itens" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitacao_id" integer NOT NULL,
	"nome" varchar(255) NOT NULL,
	"quantidade" integer NOT NULL,
	"comprado" boolean DEFAULT false NOT NULL,
	"data_prevista_entrega" date,
	"chegou" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solicitacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"requester_id" integer NOT NULL,
	"date" date NOT NULL,
	"urgente" boolean DEFAULT false NOT NULL,
	"observacao" text DEFAULT '' NOT NULL,
	"status" "solicitacao_status" DEFAULT 'aberta' NOT NULL,
	"aprovado_por_id" integer,
	"aprovado_em" timestamp,
	"motivo_reprovacao" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "solicitacao_itens" ADD CONSTRAINT "solicitacao_itens_solicitacao_id_solicitacoes_id_fk" FOREIGN KEY ("solicitacao_id") REFERENCES "public"."solicitacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_aprovado_por_id_users_id_fk" FOREIGN KEY ("aprovado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;