"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { utensilBreakageRecords } from "@/lib/db/schema";
import { canSubmitUtensilBreakage } from "@/lib/data/utensil-breakage";
import { addHistoryEntry } from "@/lib/data/history";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";

export type UtensilBreakageFormState = { error?: string } | undefined;

export async function createUtensilBreakageRecord(
  _prevState: UtensilBreakageFormState,
  formData: FormData,
): Promise<UtensilBreakageFormState> {
  const user = await getCurrentUser();

  if (!canSubmitUtensilBreakage(user)) {
    return { error: "Você não tem permissão para registrar quebra de utensílios" };
  }

  // Unidade efetiva do dia — quem está cobrindo outra unidade registra
  // pra lá. Quem não tem unidade fixa (hoje, Gestor) escolhe na hora,
  // via unitId no formulário (ver units em QuebraUtensiliosForm).
  let effectiveUnitId = await resolveEffectiveUnitId(user);
  if (!effectiveUnitId) {
    const rawUnitId = Number(formData.get("unitId"));
    if (!rawUnitId) {
      return { error: "Selecione a unidade" };
    }
    effectiveUnitId = rawUnitId;
  }

  const date = String(formData.get("date") ?? "").trim();
  const item = String(formData.get("item") ?? "").trim();
  const quantidadeRaw = String(formData.get("quantidade") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  if (!date) return { error: "Informe a data" };
  if (!item) return { error: "Informe o item quebrado" };

  const quantidade = Number(quantidadeRaw);
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return { error: "Informe uma quantidade válida" };
  }

  await db.insert(utensilBreakageRecords).values({
    unitId: effectiveUnitId,
    userId: user.id,
    date,
    item,
    quantidade,
    motivo,
  });

  await addHistoryEntry(
    user.id,
    `Registro de quebra de utensílio: ${quantidade}x ${item}`,
    "completed",
  );

  revalidatePath("/perdas");
}

export async function deleteUtensilBreakageRecord(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(utensilBreakageRecords).where(eq(utensilBreakageRecords.id, id));
  revalidatePath("/perdas");
}
