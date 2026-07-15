import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  checklistTypes,
  checklistTypeItems,
  checklistCompletions,
  users,
  type completionStatusEnum,
} from "@/lib/db/schema";

export type CompletionStatus = (typeof completionStatusEnum.enumValues)[number];

export type Viewer = {
  profile: string;
  jobFunctionId: number | null;
};

function visibleToViewer(jobFunctionId: number | null, viewer: Viewer) {
  return (
    viewer.profile === "gestor" ||
    jobFunctionId === null ||
    jobFunctionId === viewer.jobFunctionId
  );
}

function checklistVisibleToViewer(
  checklistType: { jobFunctionId: number | null; assignedUserId: number | null },
  viewer: Viewer & { id: number },
) {
  if (viewer.profile === "gestor") return true;
  if (checklistType.assignedUserId !== null) {
    return checklistType.assignedUserId === viewer.id;
  }
  return visibleToViewer(checklistType.jobFunctionId, viewer);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function getChecklistsForUser(
  type: "daily" | "weekly",
  viewer: Viewer & { id: number },
  date: string = todayISO(),
) {
  const allTypes = await db
    .select()
    .from(checklistTypes)
    .where(eq(checklistTypes.type, type))
    .orderBy(asc(checklistTypes.id));

  const types = allTypes.filter((t) => checklistVisibleToViewer(t, viewer));

  if (types.length === 0) return [];

  const typeIds = types.map((t) => t.id);

  const assignedUserIds = types
    .map((t) => t.assignedUserId)
    .filter((id): id is number => id !== null);
  const assignedUsers =
    assignedUserIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, assignedUserIds))
      : [];
  const assignedUserNameById = new Map(
    assignedUsers.map((u) => [u.id, u.name]),
  );

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
              eq(checklistCompletions.userId, viewer.id),
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
    assignedUserName: checklistType.assignedUserId
      ? (assignedUserNameById.get(checklistType.assignedUserId) ?? null)
      : null,
    items: (itemsByType.get(checklistType.id) ?? []).map((item) => {
      const completion = completionByItem.get(item.id);
      return {
        id: item.id,
        label: item.label,
        requiresPhoto: item.requiresPhoto,
        status: (completion?.status ?? "pending") as CompletionStatus,
        justification: completion?.justification ?? null,
        photoUrl: completion?.photoUrl ?? null,
      };
    }),
  }));
}

export async function getChecklistForUser(
  checklistTypeId: number,
  viewer: Viewer & { id: number },
  date: string = todayISO(),
) {
  const [checklistType] = await db
    .select()
    .from(checklistTypes)
    .where(eq(checklistTypes.id, checklistTypeId))
    .limit(1);

  if (!checklistType) return null;
  if (!checklistVisibleToViewer(checklistType, viewer)) return null;

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
              eq(checklistCompletions.userId, viewer.id),
              eq(checklistCompletions.date, date),
            ),
          )
      : [];
  const completionByItem = new Map(completions.map((c) => [c.itemId, c]));

  let assignedUserName: string | null = null;
  if (checklistType.assignedUserId) {
    const [assignedUser] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, checklistType.assignedUserId))
      .limit(1);
    assignedUserName = assignedUser?.name ?? null;
  }

  return {
    id: checklistType.id,
    name: checklistType.name,
    description: checklistType.description,
    type: checklistType.type,
    assignedUserName,
    items: items.map((item) => {
      const completion = completionByItem.get(item.id);
      return {
        id: item.id,
        label: item.label,
        requiresPhoto: item.requiresPhoto,
        status: (completion?.status ?? "pending") as CompletionStatus,
        justification: completion?.justification ?? null,
        photoUrl: completion?.photoUrl ?? null,
      };
    }),
  };
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
        photoUrl: completion?.photoUrl ?? null,
        completedAt: completion?.completedAt ?? null,
      };
    }),
  };
}
