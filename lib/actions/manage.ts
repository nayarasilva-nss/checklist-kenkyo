"use server";

import { and, asc, eq, inArray, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import {
  users,
  checklistTypes,
  checklistTypeItems,
  units,
  jobFunctions,
} from "@/lib/db/schema";

export type ActionState = { error?: string } | undefined;

function revalidateManageViews() {
  revalidatePath("/gerenciar");
  revalidatePath("/checklist");
  revalidatePath("/dashboard");
  revalidatePath("/relatorio");
  revalidatePath("/historico");
}

function parseOptionalId(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
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
  const unitId = parseOptionalId(formData, "unitId");
  const jobFunctionId = parseOptionalId(formData, "jobFunctionId");

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
    unitId,
    jobFunctionId,
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
  const unitId = parseOptionalId(formData, "unitId");
  const jobFunctionId = parseOptionalId(formData, "jobFunctionId");

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
      unitId,
      jobFunctionId,
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

export async function createUnit(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Preencha o nome da unidade" };
  }

  const existing = await db
    .select({ id: units.id })
    .from(units)
    .where(eq(units.name, name))
    .limit(1);
  if (existing.length > 0) {
    return { error: "Já existe uma unidade com esse nome" };
  }

  await db.insert(units).values({ name });
  revalidateManageViews();
}

export async function deleteUnit(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(units).where(eq(units.id, id));
  revalidateManageViews();
}

export async function createJobFunction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Preencha o nome da função" };
  }

  const existing = await db
    .select({ id: jobFunctions.id })
    .from(jobFunctions)
    .where(eq(jobFunctions.name, name))
    .limit(1);
  if (existing.length > 0) {
    return { error: "Já existe uma função com esse nome" };
  }

  await db.insert(jobFunctions).values({ name });
  revalidateManageViews();
}

export async function deleteJobFunction(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(jobFunctions).where(eq(jobFunctions.id, id));
  revalidateManageViews();
}

type ParsedItem = { label: string; requiresPhoto: boolean };

function parseItems(formData: FormData): ParsedItem[] {
  const raw = String(formData.get("itemsJson") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((entry) => ({
      label: typeof entry?.label === "string" ? entry.label.trim() : "",
      requiresPhoto: Boolean(entry?.requiresPhoto),
    }))
    .filter((item) => item.label.length > 0);
}

export async function createChecklistType(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const jobFunctionId = parseOptionalId(formData, "jobFunctionId");
  const assignedUserId = parseOptionalId(formData, "assignedUserId");
  const items = parseItems(formData);

  if (!name || (type !== "daily" && type !== "weekly") || items.length === 0) {
    return { error: "Preencha o nome, o tipo e as tarefas" };
  }

  const [checklistType] = await db
    .insert(checklistTypes)
    .values({ name, description, type, jobFunctionId, assignedUserId })
    .returning({ id: checklistTypes.id });

  await db.insert(checklistTypeItems).values(
    items.map((item, position) => ({
      checklistTypeId: checklistType.id,
      label: item.label,
      requiresPhoto: item.requiresPhoto,
      position,
    })),
  );

  revalidateManageViews();
}

export async function updateChecklistType(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const jobFunctionId = parseOptionalId(formData, "jobFunctionId");
  const assignedUserId = parseOptionalId(formData, "assignedUserId");
  const items = parseItems(formData);

  if (
    !id ||
    !name ||
    (type !== "daily" && type !== "weekly") ||
    items.length === 0
  ) {
    return { error: "Preencha o nome, o tipo e as tarefas" };
  }

  await db
    .update(checklistTypes)
    .set({ name, description, type, jobFunctionId, assignedUserId })
    .where(eq(checklistTypes.id, id));

  // Reconcile by position instead of replacing wholesale, so unchanged
  // tasks keep their id and don't lose their conformidade history.
  const existingItems = await db
    .select()
    .from(checklistTypeItems)
    .where(eq(checklistTypeItems.checklistTypeId, id))
    .orderBy(asc(checklistTypeItems.position));

  for (let position = 0; position < items.length; position++) {
    const item = items[position];
    const existing = existingItems[position];
    if (existing) {
      if (
        existing.label !== item.label ||
        existing.requiresPhoto !== item.requiresPhoto
      ) {
        await db
          .update(checklistTypeItems)
          .set({ label: item.label, requiresPhoto: item.requiresPhoto })
          .where(eq(checklistTypeItems.id, existing.id));
      }
    } else {
      await db.insert(checklistTypeItems).values({
        checklistTypeId: id,
        label: item.label,
        requiresPhoto: item.requiresPhoto,
        position,
      });
    }
  }

  if (existingItems.length > items.length) {
    const removedIds = existingItems.slice(items.length).map((i) => i.id);
    await db
      .delete(checklistTypeItems)
      .where(inArray(checklistTypeItems.id, removedIds));
  }

  revalidateManageViews();
}

export async function deleteChecklistType(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(checklistTypes).where(eq(checklistTypes.id, id));
  revalidateManageViews();
}
