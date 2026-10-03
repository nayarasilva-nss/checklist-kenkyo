ALTER TABLE "checklist_types" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "checklist_types" SET "active" = false WHERE "name" IN ('Abertura Padrão', 'Fechamento Padrão');
