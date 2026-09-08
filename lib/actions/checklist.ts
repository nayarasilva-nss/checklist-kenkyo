"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import {
  checklistTypeItems,
  checklistTypes,
  checklistCompletions,
  shiftLogs,
  requisicoes,
} from "@/lib/db/schema";
import { todayISO } from "@/lib/data/checklists";
import { recordAnomaly } from "@/lib/actions/anomalies";
import { guessSetorFromText } from "@/lib/anomaly-constants";
import { resolveEffectiveUnitId } from "@/lib/auth/covering-unit";
import { checklistDayForInstant } from "@/lib/date-utils";

const STATUS_VALUES = ["conforme", "nao-conforme", "nao-se-aplica"] as const;
type Status = (typeof STATUS_VALUES)[number];

function revalidateChecklistViews() {
  revalidatePath("/checklist");
  revalidatePath("/dashboard");
  revalidatePath("/historico");
  revalidatePath("/relatorio");
}

async function getItemContext(itemId: number, checklistTypeId: number) {
  const [row] = await db
    .select({
      requiresPhoto: checklistTypeItems.requiresPhoto,
      requiresShiftLog: checklistTypeItems.requiresShiftLog,
      requiresRequisicao: checklistTypeItems.requiresRequisicao,
      itemLabel: checklistTypeItems.label,
      checklistTypeName: checklistTypes.name,
    })
    .from(checklistTypeItems)
    .innerJoin(checklistTypes, eq(checklistTypes.id, checklistTypeItems.checklistTypeId))
    .where(
      and(
        eq(checklistTypeItems.id, itemId),
        eq(checklistTypeItems.checklistTypeId, checklistTypeId),
      ),
    )
    .limit(1);
  return row;
}

export type SetItemStatusState = { error?: string } | undefined;

export async function setChecklistItemStatus(
  _prevState: SetItemStatusState,
  formData: FormData,
): Promise<SetItemStatusState> {
  const user = await getCurrentUser();
  const itemId = Number(formData.get("itemId"));
  const checklistTypeId = Number(formData.get("checklistTypeId"));
  const status = String(formData.get("status") ?? "");
  const justification = String(formData.get("justification") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim() || null;

  if (!STATUS_VALUES.includes(status as Status)) {
    return { error: "Status inválido" };
  }

  if (status === "nao-conforme" && !justification) {
    return { error: "Justificativa é obrigatória" };
  }

  const context = await getItemContext(itemId, checklistTypeId);
  if (!context) return { error: "Item não encontrado" };

  if (context.requiresPhoto && !photoUrl) {
    return { error: "Essa tarefa exige uma foto de evidência" };
  }

  const date = todayISO();
  const effectiveUnitId = await resolveEffectiveUnitId(user);

  if (status === "conforme" && context.requiresShiftLog) {
    const [shiftLog] = await db
      .select({ id: shiftLogs.id })
      .from(shiftLogs)
      .where(and(eq(shiftLogs.userId, user.id), eq(shiftLogs.date, date)))
      .limit(1);
    if (!shiftLog) {
      return {
        error: "Você precisa preencher o diário de bordo de hoje antes de marcar esta tarefa como conforme.",
      };
    }
  }

  if (status === "conforme" && context.requiresRequisicao) {
    const recentRequisicoes = await db
      .select({ createdAt: requisicoes.createdAt })
      .from(requisicoes)
      .where(eq(requisicoes.requesterId, user.id))
      .orderBy(desc(requisicoes.createdAt))
      .limit(5);
    const hasToday = recentRequisicoes.some(
      (r) => checklistDayForInstant(r.createdAt) === date,
    );
    if (!hasToday) {
      return {
        error: "Você precisa preencher a requisição de insumos de hoje antes de marcar esta tarefa como conforme.",
      };
    }
  }

  const [completion] = await db
    .insert(checklistCompletions)
    .values({
      checklistTypeId,
      itemId,
      userId: user.id,
      date,
      status: status as Status,
      justification: status === "nao-conforme" ? justification : null,
      photoUrl,
      completedAt: new Date(),
      unitId: effectiveUnitId,
    })
    .onConflictDoUpdate({
      target: [
        checklistCompletions.itemId,
        checklistCompletions.userId,
        checklistCompletions.date,
      ],
      set: {
        status: status as Status,
        justification: status === "nao-conforme" ? justification : null,
        photoUrl,
        completedAt: new Date(),
        unitId: effectiveUnitId,
      },
    })
    .returning({ id: checklistCompletions.id });

  // A não-conformidade não deve mudar se o checklist está concluído — isso é
  // decidido só por status !== 'pending' em todas as leituras. Em vez disso,
  // ela abre uma anomalia automaticamente, ligada a esta completion (o
  // índice único em sourceChecklistCompletionId evita duplicar caso o item
  // seja resalvo com a mesma justificativa).
  if (status === "nao-conforme" && effectiveUnitId) {
    await recordAnomaly({
      unitId: effectiveUnitId,
      userId: user.id,
      date,
      relator: user.name,
      tipos: ["Operacional"],
      setores: [guessSetorFromText(context.checklistTypeName)],
      colaboradoresEnvolvidos: user.name,
      oQueAconteceu: `Item "${context.itemLabel}" do checklist "${context.checklistTypeName}" marcado como não conforme.`,
      causaPercebida: justification,
      sourceChecklistCompletionId: completion.id,
    });
  }

  revalidateChecklistViews();
}
