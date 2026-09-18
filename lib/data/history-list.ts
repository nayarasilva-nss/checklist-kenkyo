import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { history, users } from "@/lib/db/schema";

export async function getHistoryEntries(
  unitId: number | null,
  organizationId: number,
  limit = 100,
) {
  return db
    .select({
      id: history.id,
      action: history.action,
      status: history.status,
      createdAt: history.createdAt,
      userName: users.name,
    })
    .from(history)
    .innerJoin(users, eq(users.id, history.userId))
    .where(and(eq(history.organizationId, organizationId), unitId ? eq(users.unitId, unitId) : undefined))
    .orderBy(desc(history.createdAt))
    .limit(limit);
}
