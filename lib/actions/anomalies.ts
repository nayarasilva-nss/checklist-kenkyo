"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { anomalies } from "@/lib/db/schema";
import { ANOMALY_SETORES, ANOMALY_TYPES } from "@/lib/data/anomalies";
import { addHistoryEntry } from "@/lib/data/history";

export type AnomalyFormState = { error?: string } | undefined;

function getList(formData: FormData, field: string): string[] {
  return formData.getAll(field).map((v) => String(v));
}

async function sendToSpreadsheet(payload: Record<string, string>) {
  const url = process.env.ANOMALY_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Falha ao enviar anomalia para a planilha:", error);
  }
}

export async function createAnomaly(
  _prevState: AnomalyFormState,
  formData: FormData,
): Promise<AnomalyFormState> {
  const user = await getCurrentUser();

  if (!user.unitId) {
    return { error: "Seu usuário não está vinculado a uma unidade" };
  }

  const date = String(formData.get("date") ?? "").trim();
  const relator = String(formData.get("relator") ?? "").trim();
  const tipos = getList(formData, "tipos").filter((t) =>
    (ANOMALY_TYPES as readonly string[]).includes(t),
  );
  const setores = getList(formData, "setores").filter((s) =>
    (ANOMALY_SETORES as readonly string[]).includes(s),
  );
  const colaboradoresEnvolvidos = String(
    formData.get("colaboradoresEnvolvidos") ?? "",
  ).trim();
  const oQueAconteceu = String(formData.get("oQueAconteceu") ?? "").trim();
  const causaPercebida = String(formData.get("causaPercebida") ?? "").trim();
  const consequenciaImediata =
    String(formData.get("consequenciaImediata") ?? "").trim() || null;
  const acaoTomada = String(formData.get("acaoTomada") ?? "").trim() || null;
  const sugestaoTratativa =
    String(formData.get("sugestaoTratativa") ?? "").trim() || null;

  if (!date) return { error: "Informe a data" };
  if (!relator) return { error: "Informe quem está relatando" };
  if (tipos.length === 0) return { error: "Selecione ao menos um tipo de anomalia" };
  if (setores.length === 0) return { error: "Selecione ao menos um setor envolvido" };
  if (!colaboradoresEnvolvidos) {
    return { error: "Informe os colaboradores envolvidos" };
  }
  if (!oQueAconteceu) return { error: "Descreva o que aconteceu" };
  if (!causaPercebida) return { error: "Descreva a causa percebida" };

  await db.insert(anomalies).values({
    unitId: user.unitId,
    userId: user.id,
    date,
    relator,
    tipos,
    setores,
    colaboradoresEnvolvidos,
    oQueAconteceu,
    causaPercebida,
    consequenciaImediata,
    acaoTomada,
    sugestaoTratativa,
  });

  await addHistoryEntry(
    user.id,
    `Registro de anomalia: ${tipos.join(", ")}`,
    "completed",
  );

  await sendToSpreadsheet({
    data: date,
    relator,
    tipos: tipos.join(", "),
    setores: setores.join(", "),
    colaboradoresEnvolvidos,
    oQueAconteceu,
    causaPercebida,
    consequenciaImediata: consequenciaImediata ?? "",
    acaoTomada: acaoTomada ?? "",
    sugestaoTratativa: sugestaoTratativa ?? "",
  });

  revalidatePath("/anomalias");
}

export async function deleteAnomaly(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(anomalies).where(eq(anomalies.id, id));
  revalidatePath("/anomalias");
}
