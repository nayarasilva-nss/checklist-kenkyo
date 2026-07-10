"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import {
  checklistTypes,
  checklistTypeItems,
  checklistCompletions,
  templates,
  templateItems,
} from "@/lib/db/schema";
import { addHistoryEntry } from "@/lib/data/history";
import { todayISO } from "@/lib/data/checklists";

function revalidateChecklistViews() {
  revalidatePath("/checklist");
  revalidatePath("/dashboard");
  revalidatePath("/historico");
  revalidatePath("/relatorio");
}

export async function createChecklistFromTemplate(formData: FormData) {
  await getCurrentUser();

  const templateId = Number(formData.get("templateId"));
  const type = String(formData.get("type"));
  if (!templateId || (type !== "daily" && type !== "weekly")) {
    throw new Error("Dados inválidos");
  }

  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);
  if (!template) throw new Error("Modelo não encontrado");

  const items = await db
    .select()
    .from(templateItems)
    .where(eq(templateItems.templateId, templateId))
    .orderBy(templateItems.position);

  const [checklistType] = await db
    .insert(checklistTypes)
    .values({
      name: template.name,
      description: template.description,
      type,
    })
    .returning({ id: checklistTypes.id });

  if (items.length > 0) {
    await db.insert(checklistTypeItems).values(
      items.map((item, position) => ({
        checklistTypeId: checklistType.id,
        label: item.label,
        position,
      })),
    );
  }

  revalidateChecklistViews();
}

async function getItemContext(itemId: number, checklistTypeId: number) {
  const [row] = await db
    .select({
      itemLabel: checklistTypeItems.label,
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

export async function markConforme(formData: FormData) {
  const user = await getCurrentUser();
  const itemId = Number(formData.get("itemId"));
  const checklistTypeId = Number(formData.get("checklistTypeId"));

  const context = await getItemContext(itemId, checklistTypeId);
  if (!context) throw new Error("Item não encontrado");

  const date = todayISO();
  await db
    .insert(checklistCompletions)
    .values({
      checklistTypeId,
      itemId,
      userId: user.id,
      date,
      status: "conforme",
      justification: null,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        checklistCompletions.itemId,
        checklistCompletions.userId,
        checklistCompletions.date,
      ],
      set: { status: "conforme", justification: null, completedAt: new Date() },
    });

  await addHistoryEntry(
    user.id,
    `${context.itemLabel} (${context.checklistName}) marcado como Conforme`,
    "completed",
  );

  revalidateChecklistViews();
}

export async function markNaoConforme(formData: FormData) {
  const user = await getCurrentUser();
  const itemId = Number(formData.get("itemId"));
  const checklistTypeId = Number(formData.get("checklistTypeId"));
  const justification = String(formData.get("justification") ?? "").trim();

  if (!justification) {
    throw new Error("Justificativa é obrigatória");
  }

  const context = await getItemContext(itemId, checklistTypeId);
  if (!context) throw new Error("Item não encontrado");

  const date = todayISO();
  await db
    .insert(checklistCompletions)
    .values({
      checklistTypeId,
      itemId,
      userId: user.id,
      date,
      status: "nao-conforme",
      justification,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        checklistCompletions.itemId,
        checklistCompletions.userId,
        checklistCompletions.date,
      ],
      set: {
        status: "nao-conforme",
        justification,
        completedAt: new Date(),
      },
    });

  await addHistoryEntry(
    user.id,
    `${context.itemLabel} (${context.checklistName}) marcado como Não Conforme`,
    "pending",
  );

  revalidateChecklistViews();
}
