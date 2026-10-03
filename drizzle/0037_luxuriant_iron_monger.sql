-- Ligação com o ERP. Idempotente: um banco que já recebeu a versão antiga
-- desta ligação (0035_burly_ultron, do ramo ligacao-erp) não quebra.
DO $$ BEGIN CREATE TYPE "public"."erp_envio_status" AS ENUM('nao_enviada', 'pendente', 'aguardando', 'enviada', 'erro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "erp_item_codigo" varchar(60);--> statement-breakpoint
ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "erp_fator" numeric(14, 6);--> statement-breakpoint
ALTER TABLE "job_functions" ADD COLUMN IF NOT EXISTS "erp_setor" varchar(60);--> statement-breakpoint
ALTER TABLE "requisicoes" ADD COLUMN IF NOT EXISTS "erp_status" "erp_envio_status" DEFAULT 'nao_enviada' NOT NULL;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD COLUMN IF NOT EXISTS "erp_numero" varchar(30);--> statement-breakpoint
ALTER TABLE "requisicoes" ADD COLUMN IF NOT EXISTS "erp_mensagem" text;--> statement-breakpoint
ALTER TABLE "requisicoes" ADD COLUMN IF NOT EXISTS "erp_enviado_em" timestamp;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "erp_cnpj" varchar(14);--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "erp_local_interno_id" integer;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "erp_local_externo_id" integer;