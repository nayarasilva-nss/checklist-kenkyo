"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export type DocumentFormState = { error?: string } | undefined;

const CATEGORIES = ["ficha_tecnica", "pop"] as const;
type Category = (typeof CATEGORIES)[number];

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
    fileUrl,
    createdBy: user.id,
  });

  revalidatePath("/documentos");
}

export async function deleteDocument(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(documents).where(eq(documents.id, id));
  revalidatePath("/documentos");
}
