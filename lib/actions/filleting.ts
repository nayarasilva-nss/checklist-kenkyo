"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { filletingRecords } from "@/lib/db/schema";
import { canSubmitFilleting } from "@/lib/data/filleting";
import { addHistoryEntry } from "@/lib/data/history";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";

export type FilletingFormState = { error?: string } | undefined;

function parseKg(formData: FormData, field: string): number | null {
  const raw = String(formData.get(field) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  if (Number.isNaN(value) || value < 0) return null;
  return value;
}

export async function createFilletingRecord(
  _prevState: FilletingFormState,
  formData: FormData,
): Promise<FilletingFormState> {
  const user = await getCurrentUser();

  if (!canSubmitFilleting(user)) {
    return { error: "Você não tem permissão para registrar dados de filetagem" };
  }

  const effectiveUnitId = await resolveEffectiveUnitId(user);
  if (!effectiveUnitId) {
    return { error: "Seu usuário não está vinculado a uma unidade" };
  }

  const fishType = String(formData.get("fishType") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const responsavel = String(formData.get("responsavel") ?? "").trim();

  if (!fishType) return { error: "Informe o pescado" };
  if (!date) return { error: "Informe a data" };
  if (!responsavel) return { error: "Informe o responsável" };

  const recebidoKg = parseKg(formData, "recebidoKg");
  const fileKg = parseKg(formData, "fileKg");
  const pontaClaraKg = parseKg(formData, "pontaClaraKg");
  const pontaEscuraKg = parseKg(formData, "pontaEscuraKg");
  const pelesKg = parseKg(formData, "pelesKg");
  const raspasKg = parseKg(formData, "raspasKg");

  if (
    recebidoKg === null ||
    fileKg === null ||
    pontaClaraKg === null ||
    pontaEscuraKg === null ||
    pelesKg === null ||
    raspasKg === null
  ) {
    return { error: "Preencha todos os pesos com valores válidos" };
  }

  const usedKg = fileKg + pontaClaraKg + pontaEscuraKg + pelesKg + raspasKg;
  if (usedKg > recebidoKg) {
    return {
      error: "A soma dos pesos não pode ser maior que o peso recebido",
    };
  }

  await db.insert(filletingRecords).values({
    unitId: effectiveUnitId,
    userId: user.id,
    date,
    responsavel,
    fishType,
    recebidoKg: recebidoKg.toFixed(2),
    fileKg: fileKg.toFixed(2),
    pontaClaraKg: pontaClaraKg.toFixed(2),
    pontaEscuraKg: pontaEscuraKg.toFixed(2),
    pelesKg: pelesKg.toFixed(2),
    raspasKg: raspasKg.toFixed(2),
  });

  await addHistoryEntry(
    user.id,
    `Registro de filetagem de ${fishType} (${recebidoKg.toFixed(2)} kg recebidos)`,
    "completed",
  );

  revalidatePath("/perdas");
}

export async function deleteFilletingRecord(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(filletingRecords).where(eq(filletingRecords.id, id));
  revalidatePath("/perdas");
}
