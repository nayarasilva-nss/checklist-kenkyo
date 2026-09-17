CREATE TYPE "public"."solicitacao_item_status" AS ENUM('pendente', 'aprovado', 'reprovado');--> statement-breakpoint
ALTER TABLE "solicitacoes" DROP CONSTRAINT "solicitacoes_aprovado_por_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "status" SET DEFAULT 'aberta'::text;--> statement-breakpoint
DROP TYPE "public"."solicitacao_status";--> statement-breakpoint
CREATE TYPE "public"."solicitacao_status" AS ENUM('aberta', 'cancelada');--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "status" SET DEFAULT 'aberta'::"public"."solicitacao_status";--> statement-breakpoint
ALTER TABLE "solicitacoes" ALTER COLUMN "status" SET DATA TYPE "public"."solicitacao_status" USING "status"::"public"."solicitacao_status";--> statement-breakpoint
ALTER TABLE "solicitacao_itens" ADD COLUMN "status" "solicitacao_item_status" DEFAULT 'pendente' NOT NULL;--> statement-breakpoint
ALTER TABLE "solicitacao_itens" ADD COLUMN "aprovado_por_id" integer;--> statement-breakpoint
ALTER TABLE "solicitacao_itens" ADD COLUMN "aprovado_em" timestamp;--> statement-breakpoint
ALTER TABLE "solicitacao_itens" ADD COLUMN "motivo_reprovacao" text;--> statement-breakpoint
ALTER TABLE "solicitacao_itens" ADD CONSTRAINT "solicitacao_itens_aprovado_por_id_users_id_fk" FOREIGN KEY ("aprovado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes" DROP COLUMN "aprovado_por_id";--> statement-breakpoint
ALTER TABLE "solicitacoes" DROP COLUMN "aprovado_em";--> statement-breakpoint
ALTER TABLE "solicitacoes" DROP COLUMN "motivo_reprovacao";