import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  checklistTypes,
  checklistTypeItems,
  templates,
  templateItems,
} from "@/lib/db/schema";

export async function getUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      profile: users.profile,
    })
    .from(users)
    .orderBy(asc(users.id));
}

export async function getChecklistTypesWithCounts() {
  const types = await db
    .select()
    .from(checklistTypes)
    .orderBy(asc(checklistTypes.id));
  const items = await db.select().from(checklistTypeItems);

  const countByType = new Map<number, number>();
  for (const item of items) {
    countByType.set(
      item.checklistTypeId,
      (countByType.get(item.checklistTypeId) ?? 0) + 1,
    );
  }

  return types.map((t) => ({
    ...t,
    itemCount: countByType.get(t.id) ?? 0,
  }));
}

export async function getTemplatesWithCounts() {
  const rows = await db.select().from(templates).orderBy(asc(templates.id));
  const items = await db.select().from(templateItems);

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

export async function getChecklistTypeItemsGrouped() {
  const types = await db
    .select()
    .from(checklistTypes)
    .orderBy(asc(checklistTypes.id));
  const items = await db
    .select()
    .from(checklistTypeItems)
    .orderBy(asc(checklistTypeItems.position));

  const itemsByType = new Map<number, typeof items>();
  for (const item of items) {
    const list = itemsByType.get(item.checklistTypeId) ?? [];
    list.push(item);
    itemsByType.set(item.checklistTypeId, list);
  }

  return types.map((t) => ({
    ...t,
    items: itemsByType.get(t.id) ?? [],
  }));
}
