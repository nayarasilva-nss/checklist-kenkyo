ALTER TABLE "organizations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "primary_color" varchar(7);--> statement-breakpoint
UPDATE "organizations" SET "logo_url" = '/kenkyo-logo.png', "primary_color" = '#ff4d3d' WHERE "slug" = 'kenkyo';