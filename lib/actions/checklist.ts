"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import {
  checklistTypes,
  checklistTypeItems,
  checklistCompletions,
} from "@/lib/db/schema";
import { addHistoryEntry } from "@/lib/data/history";
import { todayISO } from "@/lib/data/checklists";

const STATUS_VALUES = ["conforme", "nao-conforme", "nao-se-aplica"] as const;
type Status = (typeof STATUS_VALUES)[number];

const STATUS_LABELS: Record<Status, string> = {
  conforme: "Conforme",
  "nao-conforme": "Não Conforme",
  "nao-se-aplica": "Não se Aplica",
};

function revalidateChecklistViews() {
  revalidatePath("/checklist");
  revalidatePath("/dashboard");
  revalidatePath("/historico");
  revalidatePath("/relatorio");
}

async function getItemContext(itemId: number, checklistTypeId: number) {
  const [row] = await db
    .select({
      itemLabel: checklistTypeItems.label,
      requiresPhoto: checklistTypeItems.requiresPhoto,
      checklistName: checklistTypes.name,
    })
    .from(checklistTypeItems)
    .innerJoin(
      checklistTypes,
      eq(checklistTypes.id, checklistTypeItems.checklistTypeId),
    )
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
  await db
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
      },
    });

  await addHistoryEntry(
    user.id,
    `${context.itemLabel} (${context.checklistName}) marcado como ${STATUS_LABELS[status as Status]}`,
    status === "nao-conforme" ? "pending" : "completed",
  );

  revalidateChecklistViews();
}
