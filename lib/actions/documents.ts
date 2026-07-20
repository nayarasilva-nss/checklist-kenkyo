"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { FICHA_TECNICA_CATEGORY_ORDER } from "@/lib/domain/ficha-tecnica-categorias";

export type DocumentFormState = { error?: string } | undefined;

const CATEGORIES = ["ficha_tecnica", "pop"] as const;
type Category = (typeof CATEGORIES)[number];

function readSubcategory(formData: FormData, category: string) {
  if (category !== "ficha_tecnica") return null;
  const subcategory = String(formData.get("subcategory") ?? "").trim();
  if (!subcategory) return null;
  return (FICHA_TECNICA_CATEGORY_ORDER as readonly string[]).includes(subcategory)
    ? subcategory
    : null;
}

export async function createDocument(
  _prevState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const user = await requireGestor();

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const fileUrl = String(formData.get("fileUrl") ?? "").trim();

  if (!title) return { error: "Informe um título" };
  if (!CATEGORIES.includes(category as Category)) {
    return { error: "Categoria inválida" };
  }
  if (!fileUrl) return { error: "Envie um arquivo" };

  await db.insert(documents).values({
    title,
    category: category as Category,
    subcategory: readSubcategory(formData, category),
    fileUrl,
    createdBy: user.id,
  });

  revalidatePath("/documentos");
}

export async function updateDocument(
  _prevState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  await requireGestor();

  const id = Number(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "");

  if (!id) return { error: "Documento inválido" };
  if (!title) return { error: "Informe um título" };
  if (!CATEGORIES.includes(category as Category)) {
    return { error: "Categoria inválida" };
  }

  await db
    .update(documents)
    .set({
      title,
      category: category as Category,
      subcategory: readSubcategory(formData, category),
    })
    .where(eq(documents.id, id));

  revalidatePath("/documentos");
}

export async function deleteDocument(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(documents).where(eq(documents.id, id));
  revalidatePath("/documentos");
}
