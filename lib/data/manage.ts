import "server-only";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  users,
  checklistTypes,
  checklistTypeItems,
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
  const items = await db
    .select()
    .from(checklistTypeItems)
    .orderBy(asc(checklistTypeItems.position));

  const itemsByType = new Map<
    number,
    { label: string; requiresPhoto: boolean }[]
  >();
  for (const item of items) {
    const list = itemsByType.get(item.checklistTypeId) ?? [];
    list.push({ label: item.label, requiresPhoto: item.requiresPhoto });
    itemsByType.set(item.checklistTypeId, list);
  }

  return types.map((t) => {
    const typeItems = itemsByType.get(t.id) ?? [];
    return {
      ...t,
      items: typeItems,
      itemCount: typeItems.length,
    };
  });
}
