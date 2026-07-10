"use server";

import { and, eq, ne, max } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import {
  users,
  checklistTypes,
  checklistTypeItems,
  templates,
  templateItems,
} from "@/lib/db/schema";

export type ActionState = { error?: string } | undefined;

function revalidateManageViews() {
  revalidatePath("/gerenciar");
  revalidatePath("/checklist");
  revalidatePath("/dashboard");
}

const PROFILES = ["gestor", "gerente", "lider"] as const;

export async function createUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const profile = String(formData.get("profile") ?? "");
  const password = String(formData.get("password") ?? "");

  if (
    !name ||
    !username ||
    !password ||
    !PROFILES.includes(profile as (typeof PROFILES)[number])
  ) {
    return { error: "Preencha todos os campos" };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing.length > 0) {
    return { error: "Já existe um usuário com esse login" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    name,
    username,
    passwordHash,
    profile: profile as (typeof PROFILES)[number],
  });

  revalidateManageViews();
}

export async function updateUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const profile = String(formData.get("profile") ?? "");
  const password = String(formData.get("password") ?? "");

  if (
    !id ||
    !name ||
    !username ||
    !PROFILES.includes(profile as (typeof PROFILES)[number])
  ) {
    return { error: "Preencha o nome e o usuário" };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, username), ne(users.id, id)))
    .limit(1);
  if (existing.length > 0) {
    return { error: "Já existe um usuário com esse login" };
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  await db
    .update(users)
    .set({
      name,
      username,
      profile: profile as (typeof PROFILES)[number],
      ...(passwordHash ? { passwordHash } : {}),
    })
    .where(eq(users.id, id));

  revalidateManageViews();
}

export async function deleteUser(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(users).where(eq(users.id, id));
  revalidateManageViews();
}

export async function createChecklistType(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "");

  if (!name || (type !== "daily" && type !== "weekly")) {
    return { error: "Preencha o nome do checklist" };
  }

  await db.insert(checklistTypes).values({ name, description, type });
  revalidateManageViews();
}

export async function deleteChecklistType(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(checklistTypes).where(eq(checklistTypes.id, id));
  revalidateManageViews();
}

export async function createTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const checklistTypeId = Number(formData.get("checklistTypeId"));
  const label = String(formData.get("label") ?? "").trim();

  if (!checklistTypeId || !label) {
    return { error: "Selecione o checklist e preencha o nome da tarefa" };
  }

  const [row] = await db
    .select({ maxPosition: max(checklistTypeItems.position) })
    .from(checklistTypeItems)
    .where(eq(checklistTypeItems.checklistTypeId, checklistTypeId));

  const nextPosition = (row?.maxPosition ?? -1) + 1;

  await db.insert(checklistTypeItems).values({
    checklistTypeId,
    label,
    position: nextPosition,
  });

  revalidateManageViews();
}

export async function createTemplate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const itemsText = String(formData.get("items") ?? "");
  const items = itemsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!name || items.length === 0) {
    return { error: "Preencha o nome e as tarefas" };
  }

  const [template] = await db
    .insert(templates)
    .values({ name, description })
    .returning({ id: templates.id });

  await db.insert(templateItems).values(
    items.map((label, position) => ({
      templateId: template.id,
      label,
      position,
    })),
  );

  revalidateManageViews();
}

export async function deleteTemplate(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(templates).where(eq(templates.id, id));
  revalidateManageViews();
}
