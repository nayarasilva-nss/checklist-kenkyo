import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  date,
  timestamp,
  pgEnum,
  boolean,
  numeric,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const profileEnum = pgEnum("profile", ["gestor", "gerente", "lider", "rh"]);
export const checklistTypeEnum = pgEnum("checklist_type_kind", ["daily", "weekly"]);
export const completionStatusEnum = pgEnum("completion_status", [
  "conforme",
  "nao-conforme",
  "nao-se-aplica",
  "pending",
]);
export const historyStatusEnum = pgEnum("history_status", ["completed", "pending"]);
export const documentCategoryEnum = pgEnum("document_category", [
  "ficha_tecnica",
  "pop",
]);
export const shiftStatusEnum = pgEnum("shift_status", [
  "estavel",
  "sob_pressao",
  "instavel",
]);
export const leaderSelfAssessmentEnum = pgEnum("leader_self_assessment", [
  "proativo",
  "reativo",
  "apagando_incendio",
]);
export const anomalyStatusEnum = pgEnum("anomaly_status", ["aberta", "tratada"]);
export const requisicaoTipoEnum = pgEnum("requisicao_tipo", ["interna", "externa"]);
export const requisicaoStatusEnum = pgEnum("requisicao_status", [
  "aberta",
  "conferida",
  "cancelada",
]);
export const catalogUnitMeasureEnum = pgEnum("catalog_unit_measure", [
  "kg",
  "g",
  "un",
  "L",
  "ml",
  "cx",
  "pct",
]);

export const units = pgTable(
  "units",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("units_name_idx").on(table.name)],
);

export const jobFunctions = pgTable(
  "job_functions",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("job_functions_name_idx").on(table.name)],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    username: varchar("username", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    profile: profileEnum("profile").notNull(),
    unitId: integer("unit_id").references(() => units.id, {
      onDelete: "set null",
    }),
    jobFunctionId: integer("job_function_id").references(
      () => jobFunctions.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_username_idx").on(table.username)],
);

export const checklistTypes = pgTable("checklist_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  type: checklistTypeEnum("type").notNull(),
  jobFunctionId: integer("job_function_id").references(
    () => jobFunctions.id,
    { onDelete: "set null" },
  ),
  assignedUserId: integer("assigned_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checklistTypeItems = pgTable("checklist_type_items", {
  id: serial("id").primaryKey(),
  checklistTypeId: integer("checklist_type_id")
    .notNull()
    .references(() => checklistTypes.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  position: integer("position").notNull(),
  requiresPhoto: boolean("requires_photo").notNull().default(false),
  // When true, this item can only be marked "conforme" if the user has
  // already submitted a diário de bordo (shift_logs row) for that date —
  // see setChecklistItemStatus.
  requiresShiftLog: boolean("requires_shift_log").notNull().default(false),
});

// Deprecated: superseded by checklistTypes/checklistTypeItems, which now
// hold everything a "Modelo de Checklist" needs (including a fixed tipo).
// Kept only so the one-off migrate-templates-to-checklists.ts script can
// copy any leftover rows before these tables are dropped in a follow-up
// migration.
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  jobFunctionId: integer("job_function_id").references(
    () => jobFunctions.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templateItems = pgTable("template_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .notNull()
    .references(() => templates.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  position: integer("position").notNull(),
});

export const checklistCompletions = pgTable(
  "checklist_completions",
  {
    id: serial("id").primaryKey(),
    checklistTypeId: integer("checklist_type_id")
      .notNull()
      .references(() => checklistTypes.id, { onDelete: "cascade" }),
    itemId: integer("item_id")
      .notNull()
      .references(() => checklistTypeItems.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    status: completionStatusEnum("status").notNull().default("pending"),
    justification: text("justification"),
    photoUrl: text("photo_url"),
    completedAt: timestamp("completed_at"),
    // The unit this completion counts toward — normally the user's own
    // unit, but a gerente/chefe covering another unit for the day can
    // override it (see lib/auth/covering-unit.ts). Nullable because rows
    // written before this column existed don't have it; queries fall back
    // to the user's own unit_id for those via COALESCE.
    unitId: integer("unit_id").references(() => units.id, { onDelete: "set null" }),
  },
  (table) => [
    uniqueIndex("completions_item_user_date_idx").on(
      table.itemId,
      table.userId,
      table.date,
    ),
  ],
);

export const filletingRecords = pgTable("filleting_records", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  responsavel: varchar("responsavel", { length: 255 }),
  fishType: varchar("fish_type", { length: 255 }).notNull(),
  recebidoKg: numeric("recebido_kg", { precision: 10, scale: 2 }).notNull(),
  fileKg: numeric("file_kg", { precision: 10, scale: 2 }).notNull(),
  pontaClaraKg: numeric("ponta_clara_kg", {
    precision: 10,
    scale: 2,
  }).notNull(),
  pontaEscuraKg: numeric("ponta_escura_kg", {
    precision: 10,
    scale: 2,
  }).notNull(),
  pelesKg: numeric("peles_kg", { precision: 10, scale: 2 }).notNull(),
  raspasKg: numeric("raspas_kg", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const restoIngestaRecords = pgTable("resto_ingesta_records", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  experienciasVendidas: integer("experiencias_vendidas").notNull(),
  desperdicioKg: numeric("desperdicio_kg", {
    precision: 10,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: documentCategoryEnum("category").notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  fileUrl: text("file_url").notNull(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const anomalies = pgTable(
  "anomalies",
  {
    id: serial("id").primaryKey(),
    unitId: integer("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    relator: varchar("relator", { length: 255 }).notNull(),
    tipos: text("tipos").array().notNull(),
    setores: text("setores").array().notNull(),
    colaboradoresEnvolvidos: text("colaboradores_envolvidos").notNull(),
    oQueAconteceu: text("o_que_aconteceu").notNull(),
    causaPercebida: text("causa_percebida").notNull(),
    consequenciaImediata: text("consequencia_imediata"),
    acaoTomada: text("acao_tomada"),
    sugestaoTratativa: text("sugestao_tratativa"),
    status: anomalyStatusEnum("status").notNull().default("aberta"),
    // Set only for anomalies generated automatically from a "não conforme"
    // checklist item — lets that path avoid creating a duplicate anomaly
    // if the same item is resaved (e.g. justification edited).
    sourceChecklistCompletionId: integer("source_checklist_completion_id").references(
      () => checklistCompletions.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("anomalies_source_completion_idx").on(
      table.sourceChecklistCompletionId,
    ),
  ],
);

export const shiftLogs = pgTable("shift_logs", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  setor: varchar("setor", { length: 255 }).notNull(),
  statusTurno: shiftStatusEnum("status_turno").notNull(),
  statusJustificativa: text("status_justificativa").notNull(),
  desvioDescricao: text("desvio_descricao").notNull(),
  desvioImpacto: text("desvio_impacto"),
  desvioCausaRaiz: text("desvio_causa_raiz"),
  acoesLideranca: text("acoes_lideranca").array().notNull(),
  acaoLiderancaDescricao: text("acao_lideranca_descricao"),
  outrasDecisoes: text("outras_decisoes"),
  gestaoEquipe: text("gestao_equipe").array().notNull(),
  gestaoEquipeDescricao: text("gestao_equipe_descricao"),
  autoavaliacao: leaderSelfAssessmentEnum("autoavaliacao").notNull(),
  autoavaliacaoMelhorias: text("autoavaliacao_melhorias"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shiftLogPendencias = pgTable("shift_log_pendencias", {
  id: serial("id").primaryKey(),
  shiftLogId: integer("shift_log_id")
    .notNull()
    .references(() => shiftLogs.id, { onDelete: "cascade" }),
  descricao: text("descricao").notNull(),
  responsavel: varchar("responsavel", { length: 255 }),
  prazo: date("prazo"),
  concluida: boolean("concluida").notNull().default(false),
});

// Catálogo de itens de estoque — base para o módulo de requisição
// (checklist-kenkyo/spec-requisicao-kenkyo.md). Só o perfil "gestor" edita
// categorias e produtos (ver requireGestor em lib/actions/catalog.ts).
export const catalogCategories = pgTable(
  "catalog_categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("catalog_categories_name_idx").on(table.name)],
);

export const catalogItems = pgTable(
  "catalog_items",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    categoryId: integer("category_id").references(() => catalogCategories.id, {
      onDelete: "set null",
    }),
    unitMeasure: catalogUnitMeasureEnum("unit_measure").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("catalog_items_name_idx").on(table.name)],
);

// Requisição de estoque — interna (fica na unidade) ou externa (sai pra
// fornecedor/estoque geral). Sem aprovação: nasce "aberta" e vira
// "conferida" quando o Líder de Estoque/Produção confirma o que realmente
// saiu/foi entregue (ver lib/auth/requisicoes.ts e
// spec-requisicao-kenkyo.md).
export const requisicoes = pgTable("requisicoes", {
  id: serial("id").primaryKey(),
  tipo: requisicaoTipoEnum("tipo").notNull(),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  requesterId: integer("requester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  urgente: boolean("urgente").notNull().default(false),
  observacao: text("observacao").notNull().default(""),
  status: requisicaoStatusEnum("status").notNull().default("aberta"),
  conferidoPorId: integer("conferido_por_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
  concluidoEm: timestamp("concluido_em"),
});

export const requisicaoItens = pgTable("requisicao_itens", {
  id: serial("id").primaryKey(),
  requisicaoId: integer("requisicao_id")
    .notNull()
    .references(() => requisicoes.id, { onDelete: "cascade" }),
  // Nullable: o item pode ter sido removido do catálogo depois, ou ser um
  // item personalizado adicionado só nesse pedido (mesma lógica do
  // protótipo). nome/unidadeMedida ficam sempre gravados aqui, não
  // dependem de um join, pra manter o histórico estável.
  catalogItemId: integer("catalog_item_id").references(() => catalogItems.id, {
    onDelete: "set null",
  }),
  nome: varchar("nome", { length: 255 }).notNull(),
  unidadeMedida: catalogUnitMeasureEnum("unidade_medida").notNull(),
  qtdPedida: numeric("qtd_pedida", { precision: 10, scale: 2 }).notNull(),
  qtdConferida: numeric("qtd_conferida", { precision: 10, scale: 2 }),
});

export const history = pgTable("history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  status: historyStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
