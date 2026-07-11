"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { restoIngestaRecords } from "@/lib/db/schema";
import { canSubmitRestoIngesta } from "@/lib/data/resto-ingesta";
import { addHistoryEntry } from "@/lib/data/history";

export type RestoIngestaFormState = { error?: string } | undefined;

export async function createRestoIngestaRecord(
  _prevState: RestoIngestaFormState,
  formData: FormData,
): Promise<RestoIngestaFormState> {
  const user = await getCurrentUser();

  if (!canSubmitRestoIngesta(user)) {
    return {
      error: "Você não tem permissão para registrar dados de resto ingesta",
    };
  }

  if (!user.unitId) {
    return { error: "Seu usuário não está vinculado a uma unidade" };
  }

  const date = String(formData.get("date") ?? "").trim();
  const experienciasRaw = String(
    formData.get("experienciasVendidas") ?? "",
  ).trim();
  const desperdicioRaw = String(formData.get("desperdicioKg") ?? "")
    .trim()
    .replace(",", ".");

  if (!date) return { error: "Informe a data" };

  const experienciasVendidas = Number(experienciasRaw);
  if (!Number.isInteger(experienciasVendidas) || experienciasVendidas < 0) {
    return { error: "Informe uma quantidade de experiências válida" };
  }

  const desperdicioKg = Number(desperdicioRaw);
  if (Number.isNaN(desperdicioKg) || desperdicioKg < 0) {
    return { error: "Informe um peso de desperdício válido" };
  }

  await db.insert(restoIngestaRecords).values({
    unitId: user.unitId,
    userId: user.id,
    date,
    experienciasVendidas,
    desperdicioKg: desperdicioKg.toFixed(2),
  });

  await addHistoryEntry(
    user.id,
    `Registro de resto ingesta: ${experienciasVendidas} experiências, ${desperdicioKg.toFixed(2)} kg de desperdício`,
    "completed",
  );

  revalidatePath("/resto-ingesta");
}
