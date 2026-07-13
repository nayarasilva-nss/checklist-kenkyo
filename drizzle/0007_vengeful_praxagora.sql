CREATE TABLE "anomalies" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"relator" varchar(255) NOT NULL,
	"tipos" text[] NOT NULL,
	"setores" text[] NOT NULL,
	"colaboradores_envolvidos" text NOT NULL,
	"o_que_aconteceu" text NOT NULL,
	"causa_percebida" text NOT NULL,
	"consequencia_imediata" text,
	"acao_tomada" text,
	"sugestao_tratativa" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;