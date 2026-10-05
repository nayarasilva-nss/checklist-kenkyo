ALTER TABLE "requisicao_itens" ADD COLUMN "qtd_recebida" numeric(10, 3);--> statement-breakpoint
ALTER TABLE "requisicoes" ADD COLUMN "recebido_em" timestamp;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD COLUMN "recebido_por_id" integer;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD COLUMN "recebimento_obs" text;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD CONSTRAINT "requisicoes_recebido_por_id_users_id_fk" FOREIGN KEY ("recebido_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;