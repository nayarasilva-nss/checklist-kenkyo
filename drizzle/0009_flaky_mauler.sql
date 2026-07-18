CREATE TYPE "public"."leader_self_assessment" AS ENUM('proativo', 'reativo', 'apagando_incendio');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('estavel', 'sob_pressao', 'instavel');--> statement-breakpoint
CREATE TABLE "shift_log_pendencias" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_log_id" integer NOT NULL,
	"descricao" text NOT NULL,
	"responsavel" varchar(255),
	"prazo" date
);
--> statement-breakpoint
CREATE TABLE "shift_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"setor" varchar(255) NOT NULL,
	"status_turno" "shift_status" NOT NULL,
	"status_justificativa" text NOT NULL,
	"desvio_descricao" text NOT NULL,
	"desvio_impacto" text,
	"desvio_causa_raiz" text,
	"acoes_lideranca" text[] NOT NULL,
	"acao_lideranca_descricao" text,
	"outras_decisoes" text,
	"gestao_equipe" text[] NOT NULL,
	"gestao_equipe_descricao" text,
	"autoavaliacao" "leader_self_assessment" NOT NULL,
	"autoavaliacao_melhorias" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shift_log_pendencias" ADD CONSTRAINT "shift_log_pendencias_shift_log_id_shift_logs_id_fk" FOREIGN KEY ("shift_log_id") REFERENCES "public"."shift_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_logs" ADD CONSTRAINT "shift_logs_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_logs" ADD CONSTRAINT "shift_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;