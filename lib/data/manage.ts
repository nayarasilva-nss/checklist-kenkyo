import "server-only";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  users,
  checklistTypes,
  checklistTypeItems,
  templates,
  templateItems,
  units,
  jobFunctions,
} from "@/lib/db/schema";

const assignedUsers = alias(users, "assigned_users");

export { getUnits, getJobFunctions } from "./units";

export async function getUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      profile: users.profile,
      unitId: users.unitId,
      unitName: units.name,
      jobFunctionId: users.jobFunctionId,
      jobFunctionName: jobFunctions.name,
    })
    .from(users)
    .leftJoin(units, eq(units.id, users.unitId))
    .leftJoin(jobFunctions, eq(jobFunctions.id, users.jobFunctionId))
    .orderBy(asc(users.id));
}

export async function getChecklistTypesWithCounts() {
  const types = await db
    .select({
      id: checklistTypes.id,
      name: checklistTypes.name,
      description: checklistTypes.description,
      type: checklistTypes.type,
      jobFunctionId: checklistTypes.jobFunctionId,
      jobFunctionName: jobFunctions.name,
      assignedUserId: checklistTypes.assignedUserId,
      assignedUserName: assignedUsers.name,
    })
    .from(checklistTypes)
    .leftJoin(jobFunctions, eq(jobFunctions.id, checklistTypes.jobFunctionId))
    .leftJoin(assignedUsers, eq(assignedUsers.id, checklistTypes.assignedUserId))
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
  const rows = await db
    .select({
      id: templates.id,
      name: templates.name,
      description: templates.description,
      jobFunctionId: templates.jobFunctionId,
      jobFunctionName: jobFunctions.name,
    })
    .from(templates)
    .leftJoin(jobFunctions, eq(jobFunctions.id, templates.jobFunctionId))
    .orderBy(asc(templates.id));
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
