"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireGestor } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { shiftLogPendencias, shiftLogs } from "@/lib/db/schema";
import {
  LEADER_SELF_ASSESSMENT,
  LEADERSHIP_ACTIONS,
  SHIFT_STATUS,
  TEAM_MANAGEMENT_ACTIONS,
} from "@/lib/shift-log-constants";
import { addHistoryEntry } from "@/lib/data/history";

export type ShiftLogFormState = { error?: string } | undefined;

type PendenciaInput = { descricao: string; responsavel: string; prazo: string };

function getList(formData: FormData, field: string): string[] {
  return formData.getAll(field).map((v) => String(v));
}

function parsePendencias(formData: FormData): PendenciaInput[] {
  const raw = String(formData.get("pendencias") ?? "[]");
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((p) => ({
        descricao: String(p.descricao ?? "").trim(),
        responsavel: String(p.responsavel ?? "").trim(),
        prazo: String(p.prazo ?? "").trim(),
      }))
      .filter((p) => p.descricao);
  } catch {
    return [];
  }
}

export async function createShiftLog(
  _prevState: ShiftLogFormState,
  formData: FormData,
): Promise<ShiftLogFormState> {
  const user = await getCurrentUser();

  if (!user.unitId) {
    return { error: "Seu usuário não está vinculado a uma unidade" };
  }

  const date = String(formData.get("date") ?? "").trim();
  const setor = String(formData.get("setor") ?? "").trim();
  const statusTurno = String(formData.get("statusTurno") ?? "").trim();
  const statusJustificativa = String(formData.get("statusJustificativa") ?? "").trim();
  const desvioDescricao = String(formData.get("desvioDescricao") ?? "").trim();
  const desvioImpacto = String(formData.get("desvioImpacto") ?? "").trim() || null;
  const desvioCausaRaiz = String(formData.get("desvioCausaRaiz") ?? "").trim() || null;
  const acoesLideranca = getList(formData, "acoesLideranca").filter((a) =>
    (LEADERSHIP_ACTIONS as readonly string[]).includes(a),
  );
  const acaoLiderancaDescricao =
    String(formData.get("acaoLiderancaDescricao") ?? "").trim() || null;
  const outrasDecisoes = String(formData.get("outrasDecisoes") ?? "").trim() || null;
  const gestaoEquipe = getList(formData, "gestaoEquipe").filter((g) =>
    (TEAM_MANAGEMENT_ACTIONS as readonly string[]).includes(g),
  );
  const gestaoEquipeDescricao =
    String(formData.get("gestaoEquipeDescricao") ?? "").trim() || null;
  const autoavaliacao = String(formData.get("autoavaliacao") ?? "").trim();
  const autoavaliacaoMelhorias =
    String(formData.get("autoavaliacaoMelhorias") ?? "").trim() || null;
  const pendencias = parsePendencias(formData);

  if (!date) return { error: "Informe a data" };
  if (!setor) return { error: "Informe o setor" };
  if (!SHIFT_STATUS.some((s) => s.value === statusTurno)) {
    return { error: "Selecione a situação da operação" };
  }
  if (!statusJustificativa) return { error: "Justifique a situação da operação" };
  if (!desvioDescricao) return { error: "Descreva o principal desvio do turno" };
  if (!LEADER_SELF_ASSESSMENT.some((a) => a.value === autoavaliacao)) {
    return { error: "Selecione sua autoavaliação como líder" };
  }

  const [inserted] = await db
    .insert(shiftLogs)
    .values({
      unitId: user.unitId,
      userId: user.id,
      date,
      setor,
      statusTurno: statusTurno as (typeof SHIFT_STATUS)[number]["value"],
      statusJustificativa,
      desvioDescricao,
      desvioImpacto,
      desvioCausaRaiz,
      acoesLideranca,
      acaoLiderancaDescricao,
      outrasDecisoes,
      gestaoEquipe,
      gestaoEquipeDescricao,
      autoavaliacao: autoavaliacao as (typeof LEADER_SELF_ASSESSMENT)[number]["value"],
      autoavaliacaoMelhorias,
    })
    .returning({ id: shiftLogs.id });

  if (pendencias.length > 0) {
    await db.insert(shiftLogPendencias).values(
      pendencias.map((p) => ({
        shiftLogId: inserted.id,
        descricao: p.descricao,
        responsavel: p.responsavel || null,
        prazo: p.prazo || null,
      })),
    );
  }

  await addHistoryEntry(user.id, `Diário de bordo registrado (${setor})`, "completed");

  revalidatePath("/diario-de-bordo");
}

export async function deleteShiftLog(formData: FormData) {
  await requireGestor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(shiftLogs).where(eq(shiftLogs.id, id));
  revalidatePath("/diario-de-bordo");
}
