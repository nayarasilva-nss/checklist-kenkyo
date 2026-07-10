import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  date,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const profileEnum = pgEnum("profile", ["gestor", "gerente", "lider"]);
export const checklistTypeEnum = pgEnum("checklist_type_kind", ["daily", "weekly"]);
export const completionStatusEnum = pgEnum("completion_status", [
  "conforme",
  "nao-conforme",
  "pending",
]);
export const historyStatusEnum = pgEnum("history_status", ["completed", "pending"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    username: varchar("username", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    profile: profileEnum("profile").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_username_idx").on(table.username)],
);

export const checklistTypes = pgTable("checklist_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  type: checklistTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checklistTypeItems = pgTable("checklist_type_items", {
  id: serial("id").primaryKey(),
  checklistTypeId: integer("checklist_type_id")
    .notNull()
    .references(() => checklistTypes.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  position: integer("position").notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
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
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    uniqueIndex("completions_item_user_date_idx").on(
      table.itemId,
      table.userId,
      table.date,
    ),
  ],
);

export const history = pgTable("history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  status: historyStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
