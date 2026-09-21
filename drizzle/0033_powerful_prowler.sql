ALTER TABLE "audit_answers" ADD COLUMN "weight" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_answers" ADD COLUMN "how_to_verify" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_answers" ADD COLUMN "responsible" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_answers" ADD COLUMN "applies_to" varchar(255) DEFAULT 'Todas' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_items" ADD COLUMN "weight" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_items" ADD COLUMN "how_to_verify" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_items" ADD COLUMN "responsible" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_items" ADD COLUMN "applies_to" varchar(255) DEFAULT 'Todas' NOT NULL;