"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { catalogCategories, catalogItems, catalogUnitMeasureEnum } from "@/lib/db/schema";

export type ActionState = { error?: string } | undefined;

const UNIT_MEASURES = catalogUnitMeasureEnum.enumValues;

function revalidateCatalogViews() {
  revalidatePath("/gerenciar");
}

function parseOptionalId(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export async function createCategory(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Preencha o nome da categoria" };
  }

  const existing = await db
    .select({ id: catalogCategories.id })
    .from(catalogCategories)
    .where(eq(catalogCategories.name, name))
    .limit(1);
  if (existing.length > 0) {
    return { error: "Já existe uma categoria com esse nome" };
  }

  await db.insert(catalogCategories).values({ name });
  revalidateCatalogViews();
}

export async function updateCategory(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) {
    return { error: "Preencha o nome da categoria" };
  }

  const existing = await db
    .select({ id: catalogCategories.id })
    .from(catalogCategories)
    .where(and(eq(catalogCategories.name, name), ne(catalogCategories.id, id)))
    .limit(1);
  if (existing.length > 0) {
    return { error: "Já existe uma categoria com esse nome" };
  }

  await db.update(catalogCategories).set({ name }).where(eq(catalogCategories.id, id));
  revalidateCatalogViews();
}

export async function deleteCategory(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(catalogCategories).where(eq(catalogCategories.id, id));
  revalidateCatalogViews();
}

function isValidUnitMeasure(value: string): value is (typeof UNIT_MEASURES)[number] {
  return (UNIT_MEASURES as readonly string[]).includes(value);
}

export async function createCatalogItem(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const name = String(formData.get("name") ?? "").trim();
  const unitMeasure = String(formData.get("unitMeasure") ?? "");
  const categoryId = parseOptionalId(formData, "categoryId");

  if (!name || !isValidUnitMeasure(unitMeasure)) {
    return { error: "Preencha o nome e a unidade de medida" };
  }

  const existing = await db
    .select({ id: catalogItems.id })
    .from(catalogItems)
    .where(eq(catalogItems.name, name))
    .limit(1);
  if (existing.length > 0) {
    return { error: "Já existe um produto com esse nome" };
  }

  await db.insert(catalogItems).values({ name, unitMeasure, categoryId });
  revalidateCatalogViews();
}

export async function updateCatalogItem(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireGestor();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const unitMeasure = String(formData.get("unitMeasure") ?? "");
  const categoryId = parseOptionalId(formData, "categoryId");

  if (!id || !name || !isValidUnitMeasure(unitMeasure)) {
    return { error: "Preencha o nome e a unidade de medida" };
  }

  const existing = await db
    .select({ id: catalogItems.id })
    .from(catalogItems)
    .where(and(eq(catalogItems.name, name), ne(catalogItems.id, id)))
    .limit(1);
  if (existing.length > 0) {
    return { error: "Já existe um produto com esse nome" };
  }

  await db
    .update(catalogItems)
    .set({ name, unitMeasure, categoryId })
    .where(eq(catalogItems.id, id));
  revalidateCatalogViews();
}

export async function deleteCatalogItem(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(catalogItems).where(eq(catalogItems.id, id));
  revalidateCatalogViews();
}
