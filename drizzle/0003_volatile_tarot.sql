ALTER TYPE "public"."completion_status" ADD VALUE 'nao-se-aplica' BEFORE 'pending';--> statement-breakpoint
ALTER TABLE "checklist_completions" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "checklist_type_items" ADD COLUMN "requires_photo" boolean DEFAULT false NOT NULL;