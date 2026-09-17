CREATE TABLE "checklist_type_prerequisites" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_type_id" integer NOT NULL,
	"requires_checklist_type_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "filleting_records" ALTER COLUMN "recebido_kg" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "filleting_records" ALTER COLUMN "file_kg" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "filleting_records" ALTER COLUMN "ponta_clara_kg" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "filleting_records" ALTER COLUMN "ponta_escura_kg" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "filleting_records" ALTER COLUMN "peles_kg" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "filleting_records" ALTER COLUMN "raspas_kg" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "requisicao_itens" ALTER COLUMN "qtd_pedida" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "requisicao_itens" ALTER COLUMN "qtd_conferida" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "resto_ingesta_records" ALTER COLUMN "desperdicio_kg" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "checklist_type_prerequisites" ADD CONSTRAINT "checklist_type_prerequisites_checklist_type_id_checklist_types_id_fk" FOREIGN KEY ("checklist_type_id") REFERENCES "public"."checklist_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_type_prerequisites" ADD CONSTRAINT "checklist_type_prerequisites_requires_checklist_type_id_checklist_types_id_fk" FOREIGN KEY ("requires_checklist_type_id") REFERENCES "public"."checklist_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_type_prereq_idx" ON "checklist_type_prerequisites" USING btree ("checklist_type_id","requires_checklist_type_id");