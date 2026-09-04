CREATE TYPE "public"."anomaly_status" AS ENUM('aberta', 'tratada');--> statement-breakpoint
ALTER TABLE "anomalies" ADD COLUMN "status" "anomaly_status" DEFAULT 'aberta' NOT NULL;