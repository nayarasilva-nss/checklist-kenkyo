import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  checklistTypes,
  checklistTypeItems,
  checklistCompletions,
  templates,
  templateItems,
  type completionStatusEnum,
} from "@/lib/db/schema";

export type CompletionStatus = (typeof completionStatusEnum.enumValues)[number];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTemplates() {
  const rows = await db
    .select({
      id: templates.id,
      name: templates.name,
      description: templates.description,
    })
    .from(templates)
    .orderBy(asc(templates.id));

  const items = await db
    .select({
      templateId: templateItems.templateId,
      label: templateItems.label,
    })
    .from(templateItems);

  const countByTemplate = new Map<number, number>();
  for (const item of items) {
    countByTemplate.set(
      item.templateId,
      (countByTemplate.get(item.templateId) ?? 0) + 1,
    );
  }

  return rows.map((t) => ({
    ...t,
    itemCount: countByTemplate.get(t.id) ?? 0,
  }));
}

export async function getChecklistsForUser(
  type: "daily" | "weekly",
  userId: number,
  date: string = todayISO(),
) {
  const types = await db
    .select()
    .from(checklistTypes)
    .where(eq(checklistTypes.type, type))
    .orderBy(asc(checklistTypes.id));

  if (types.length === 0) return [];

  const typeIds = types.map((t) => t.id);

  const items = await db
    .select()
    .from(checklistTypeItems)
    .where(inArray(checklistTypeItems.checklistTypeId, typeIds))
    .orderBy(asc(checklistTypeItems.position));

  const itemIds = items.map((i) => i.id);

  const completions =
    itemIds.length > 0
      ? await db
          .select()
          .from(checklistCompletions)
          .where(
            and(
              inArray(checklistCompletions.itemId, itemIds),
              eq(checklistCompletions.userId, userId),
              eq(checklistCompletions.date, date),
            ),
          )
      : [];

  const completionByItem = new Map(completions.map((c) => [c.itemId, c]));
  const itemsByType = new Map<number, typeof items>();
  for (const item of items) {
    const list = itemsByType.get(item.checklistTypeId) ?? [];
    list.push(item);
    itemsByType.set(item.checklistTypeId, list);
  }

  return types.map((checklistType) => ({
    id: checklistType.id,
    name: checklistType.name,
    description: checklistType.description,
    items: (itemsByType.get(checklistType.id) ?? []).map((item) => {
      const completion = completionByItem.get(item.id);
      return {
        id: item.id,
        label: item.label,
        status: (completion?.status ?? "pending") as CompletionStatus,
        justification: completion?.justification ?? null,
      };
    }),
  }));
}

export async function getChecklistExportData(
  checklistTypeId: number,
  userId: number,
  date: string = todayISO(),
) {
  const [checklistType] = await db
    .select()
    .from(checklistTypes)
    .where(eq(checklistTypes.id, checklistTypeId))
    .limit(1);

  if (!checklistType) return null;

  const items = await db
    .select()
    .from(checklistTypeItems)
    .where(eq(checklistTypeItems.checklistTypeId, checklistTypeId))
    .orderBy(asc(checklistTypeItems.position));

  const itemIds = items.map((i) => i.id);
  const completions =
    itemIds.length > 0
      ? await db
          .select()
          .from(checklistCompletions)
          .where(
            and(
              inArray(checklistCompletions.itemId, itemIds),
              eq(checklistCompletions.userId, userId),
              eq(checklistCompletions.date, date),
            ),
          )
      : [];

  const completionByItem = new Map(completions.map((c) => [c.itemId, c]));

  return {
    checklistType,
    items: items.map((item) => {
      const completion = completionByItem.get(item.id);
      return {
        label: item.label,
        status: (completion?.status ?? "pending") as CompletionStatus,
        justification: completion?.justification ?? null,
        completedAt: completion?.completedAt ?? null,
      };
    }),
  };
}
